import crypto from "node:crypto";

function roleCode(value) {
  const code=String(value||"customer").toLowerCase().replace(/[^a-z0-9]/g,"");
  return ["superadmin","admin","agent","marketer","customermarketer","member","customer"].includes(code)?code:"customer";
}

function localDateTime(value) {
  const raw=String(value||"").trim().replace("T"," ");
  if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw)) {
    const [base,fraction="000000"]=raw.split(".");
    return base+"."+fraction.padEnd(6,"0").slice(0,6);
  }
  const date=value instanceof Date?value:new Date(value||Date.now());
  const parts=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Asia/Tehran",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
  }).formatToParts(date);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return p.year+"-"+p.month+"-"+p.day+" "+p.hour+":"+p.minute+":"+p.second+".000000";
}

function splitName(value) {
  const parts=String(value||"کاربر جدید").trim().replace(/\s+/g," ").split(" ");
  return {first:parts.shift()||"کاربر",last:parts.join(" ")||""};
}

export async function syncUserToMariaDB(pool,user) {
  const appUserId=String(user.id||"");
  if(!/^\d+$/.test(appUserId))throw new Error("شناسه کاربر برنامه معتبر نیست.");
  const role=roleCode(user.effective_role||user.role);
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [mapping]=await conn.query(
      "SELECT MariaDbUserId FROM DigibailAppUserIdentity WHERE AppUserId=? LIMIT 1",
      [appUserId]
    );
    const name=splitName(user.full_name);
    const phone=String(user.phone||"").trim()||null;
    const email=String(user.email||"").trim().slice(0,254)||null;
    const nationalCode=String(user.national_code||"").trim()||null;
    const regDate=localDateTime(user.created_at_tehran||user.created_at);
    let mariaId=mapping[0]?.MariaDbUserId||null;

    if(!mariaId) {
      let username=String(user.username||phone||("digibail_"+appUserId)).trim().slice(0,128)||("digibail_"+appUserId);
      let normalized=username.toUpperCase();
      const [usernameClash]=await conn.query(
        "SELECT Id FROM AspNetUsers WHERE NormalizedUserName=? LIMIT 1",
        [normalized]
      );
      if(usernameClash.length) {
        username=("digibail_"+appUserId).slice(0,128);
        normalized=username.toUpperCase();
      }
      const [result]=await conn.query("INSERT INTO AspNetUsers SET ?",{
        FirstName:name.first,
        LastName:name.last,
        Gender:0,
        Mobile:phone,
        LastLoginDate:null,
        IsActive:user.is_active===false||user.is_active===0?0:1,
        NationalCode:nationalCode,
        TotalSavedMoney:0,
        ViewCount:0,
        UserName:username,
        NormalizedUserName:normalized,
        Email:email,
        NormalizedEmail:email?email.toUpperCase():null,
        EmailConfirmed:0,
        PasswordHash:null,
        SecurityStamp:null,
        ConcurrencyStamp:crypto.randomUUID(),
        PhoneNumber:phone,
        PhoneNumberConfirmed:phone?1:0,
        TwoFactorEnabled:0,
        LockoutEnabled:0,
        AccessFailedCount:0,
        RegDate:regDate,
        Phone:phone?phone.replace(/^0/,"").slice(0,10):null,
        MobileVerified:phone?1:0,
        RegistrationCompleted:1
      });
      mariaId=result.insertId;
      if(!mariaId)throw new Error("ثبت حساب در جدول اصلی کاربران تأیید نشد.");
    } else {
      await conn.query(
        "UPDATE AspNetUsers SET FirstName=?,LastName=?,Mobile=?,PhoneNumber=?,Phone=?,Email=?,NormalizedEmail=?,NationalCode=?,IsActive=?,RegDate=? WHERE Id=?",
        [name.first,name.last,phone,phone,phone?phone.replace(/^0/,"").slice(0,10):null,email,email?email.toUpperCase():null,nationalCode,user.is_active===false||user.is_active===0?0:1,regDate,mariaId]
      );
    }

    const [roles]=await conn.query("SELECT Id,Name FROM AspNetRoles");
    let selected=roles.find(r=>String(r.Name||"").toLowerCase().replace(/[^a-z0-9]/g,"")===role);
    if(!selected) {
      const [createdRole]=await conn.query(
        "INSERT INTO AspNetRoles(Name,NormalizedName,ConcurrencyStamp) VALUES(?,?,?)",
        [role,role.toUpperCase(),crypto.randomUUID()]
      );
      selected={Id:createdRole.insertId,Name:role};
    }
    await conn.query("DELETE FROM AspNetUserRoles WHERE UserId=?",[mariaId]);
    await conn.query("INSERT INTO AspNetUserRoles(UserId,RoleId) VALUES(?,?)",[mariaId,selected.Id]);
    await conn.query(
      "INSERT INTO DigibailAppUserIdentity(AppUserId,MariaDbUserId,RoleCode) VALUES(?,?,?) ON DUPLICATE KEY UPDATE MariaDbUserId=VALUES(MariaDbUserId),RoleCode=VALUES(RoleCode)",
      [appUserId,mariaId,role]
    );
    await conn.commit();
    return {status:mapping.length?"updated":"mirrored",mariaUserId:String(mariaId),role};
  } catch(error) {
    await conn.rollback().catch(()=>{});
    throw error;
  } finally {
    conn.release();
  }
}
