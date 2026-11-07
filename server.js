import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.TOTO_API_TOKEN || "";
const ROOT = process.cwd();
const mime = {
  ".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",
  ".webmanifest":"application/manifest+json",".svg":"image/svg+xml",
  ".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"
};
const events = [{at:new Date().toISOString(),message:"AI Agent Hub server started. Social platforms are not connected yet."}];

function json(res, status, body) {
  res.writeHead(status, {"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
  res.end(JSON.stringify(body));
}
function auth(req) {
  if (!TOKEN) return process.env.NODE_ENV !== "production";
  const got = Buffer.from((req.headers.authorization || "").replace(/^Bearer\\s+/i,""));
  const expected = Buffer.from(TOKEN);
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}
http.createServer((req,res) => {
  const u = new URL(req.url, "http://localhost");
  if (u.pathname.startsWith("/api/")) {
    if (!auth(req)) return json(res,401,{ok:false,error:"unauthorized"});
    if (u.pathname === "/api/health") return json(res,200,{ok:true,service:"AI Agent Hub",time:new Date().toISOString()});
    if (u.pathname === "/api/status") return json(res,200,{
      ok:true,agent:{name:"AI Agent Hub",state:"ready"},
      platforms:{TikTok:false,YouTube:false,Facebook:false,Instagram:false},
      analytics:{connected:false},activities:events.slice(-20).reverse()
    });
    if (u.pathname === "/api/activities") return json(res,200,{items:events.slice(-50).reverse()});
    return json(res,404,{ok:false,error:"not_found"});
  }
  let pathname;
  try { pathname = decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname); }
  catch { res.writeHead(400); return res.end("Bad Request"); }
  const file = path.resolve(ROOT, "." + pathname);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end("Not Found");}
    res.writeHead(200,{"content-type":mime[path.extname(file)] || "application/octet-stream",
      "cache-control":path.basename(file)==="sw.js"?"no-cache":"public, max-age=300"});
    res.end(data);
  });
}).listen(PORT,"0.0.0.0",()=>console.log("AI Agent Hub listening on "+PORT));
