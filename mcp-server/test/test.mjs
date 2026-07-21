/* تست محلی هندلر MCP بدون نیاز به Cloudflare — با Request/Response خود Node */
import worker from "../src/index.js";

const BASE = "http://localhost/mcp";
let failures = 0;

async function rpc(body) {
  const res = await worker.fetch(
    new Request(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return { status: res.status, json: res.status === 202 ? null : await res.json() };
}

function check(label, cond) {
  if (cond) console.log("  ok:", label);
  else { failures++; console.error("  FAIL:", label); }
}

// initialize
let r = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
check("initialize protocolVersion", r.json.result.protocolVersion === "2025-06-18");
check("initialize serverInfo", r.json.result.serverInfo.name === "silvershop-mcp");

// notifications/initialized → 202
r = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
check("initialized notification 202", r.status === 202);

// tools/list
r = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
check("tools/list returns 4 tools", r.json.result.tools.length === 4);

// list_products
r = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_products", arguments: {} } });
let data = JSON.parse(r.json.result.content[0].text);
check("list_products 3 categories", data.categories.length === 3);

// get_contact
r = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_contact", arguments: {} } });
data = JSON.parse(r.json.result.content[0].text);
check("get_contact phone", data.phone === "+989923166200");

// request_consultation
r = await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "request_consultation", arguments: { name: "سارا محمدی", topic: "نیم‌ست زنانه" } } });
data = JSON.parse(r.json.result.content[0].text);
check("consultation link", data.whatsapp_link.startsWith("https://wa.me/989923166200?text="));
check("consultation preview has name", data.message_preview.includes("سارا"));

// request_consultation بدون نام → isError
r = await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "request_consultation", arguments: {} } });
check("consultation missing name isError", r.json.result.isError === true);

// ابزار ناشناخته
r = await rpc({ jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "nope", arguments: {} } });
check("unknown tool error", r.json.error?.code === -32602);

// متد ناشناخته
r = await rpc({ jsonrpc: "2.0", id: 8, method: "resources/list" });
check("unknown method error", r.json.error?.code === -32601);

// JSON خراب
const bad = await worker.fetch(new Request(BASE, { method: "POST", body: "{oops" }));
check("bad json 400", bad.status === 400);

// GET روی /mcp
const g = await worker.fetch(new Request(BASE, { method: "GET" }));
check("GET /mcp 405", g.status === 405);

// صفحه راهنما
const home = await worker.fetch(new Request("http://localhost/", { method: "GET" }));
check("root info page", (await home.text()).includes("MCP Server"));

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
