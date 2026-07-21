/* ============================================================
   SilvershopIR MCP Server — Cloudflare Worker
   پروتکل MCP روی Streamable HTTP (بدون state، بدون وابستگی)
   کلاینت‌های هوش مصنوعی (Claude و…) با آدرس /mcp وصل می‌شوند.
   ============================================================ */

const SERVER_INFO = { name: "silvershop-mcp", version: "1.0.0" };
const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

/* ---------- داده‌های فروشگاه ---------- */
const STORE = {
  brand: "SilvershopIR",
  tagline: "زیورآلات نقره ۹۲۵ دست‌ساز اصفهان",
  city: "اصفهان",
  address: "اصفهان، اتوبان چمران، خیابان آل محمد، مجموعه نقش جهان",
  phone: "+989923166200",
  phoneDisplay: "0992 316 6200",
  whatsapp: "https://wa.me/989923166200",
  website: "https://mohammadmarghzari.github.io/web-site-silver/",
  purity: "925",
  about:
    "SilvershopIR از دل مجموعه نقش جهان اصفهان آغاز شد؛ با یک باور ساده: نقره‌ی خوب باید هم اصیل باشد، هم در دسترس. " +
    "هر قطعه از نقره‌ی ۹۲۵ عیار و با وسواس در جزئیات انتخاب یا ساخته می‌شود.",
};

const PRODUCTS = [
  {
    id: "mens-rings",
    category: "انگشتر مردانه",
    description:
      "رکاب‌های پهنِ قلم‌زنی‌شده با نگین‌های فیروزه، عقیق و اونیکس — برای سلیقه‌های کلاسیک و امروزی.",
    highlights: ["نگین فیروزه با رکاب قلم‌زنی", "نگین عقیق و اونیکس", "نقره ۹۲۵ عیار"],
    pricing: "برای استعلام قیمت روز و موجودی، از ابزار request_consultation استفاده کنید.",
  },
  {
    id: "womens-rings",
    category: "انگشتر زنانه",
    description:
      "ظرافتِ نقره در رکاب‌های باریکِ نگین‌کاری‌شده؛ از نگین‌های زمردی تا سولیترهای کلاسیک و طرح‌های مینیمال.",
    highlights: ["نگین سبز زمردی", "سولیتر کلاسیک", "طرح‌های مینیمال روز"],
    pricing: "برای استعلام قیمت روز و موجودی، از ابزار request_consultation استفاده کنید.",
  },
  {
    id: "womens-half-sets",
    category: "نیم‌ست زنانه",
    description:
      "هماهنگیِ کامل گردنبند و گوشواره؛ نیم‌ست‌هایی که برای هدیه دادن و لحظه‌های خاص ساخته شده‌اند.",
    highlights: ["ست گردنبند و گوشواره", "مناسب هدیه", "نقره ۹۲۵ عیار"],
    pricing: "برای استعلام قیمت روز و موجودی، از ابزار request_consultation استفاده کنید.",
  },
];

/* ---------- تعریف ابزارها ---------- */
const TOOLS = [
  {
    name: "list_products",
    title: "لیست محصولات",
    description:
      "دسته‌های محصولات فروشگاه نقره SilvershopIR اصفهان را برمی‌گرداند: انگشتر مردانه، انگشتر زنانه و نیم‌ست زنانه، همراه با توضیح هر دسته.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_store_info",
    title: "درباره فروشگاه",
    description:
      "معرفی فروشگاه، شهر، عیار نقره و داستان برند SilvershopIR را برمی‌گرداند.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_contact",
    title: "اطلاعات تماس",
    description:
      "راه‌های تماس با فروشگاه: تلفن، لینک واتساپ، آدرس حضوری در اصفهان و وب‌سایت.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "request_consultation",
    title: "درخواست مشاوره",
    description:
      "برای کاربر یک لینک آماده واتساپ می‌سازد تا درخواست مشاوره یا استعلام قیمت را مستقیم برای فروشگاه بفرستد. " +
      "نام الزامی است؛ موضوع و متن پیام اختیاری.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "نام و نام خانوادگی درخواست‌دهنده" },
        phone: { type: "string", description: "شماره تماس (اختیاری)" },
        topic: {
          type: "string",
          description: "موضوع: انگشتر مردانه، انگشتر زنانه، نیم‌ست زنانه یا سایر",
        },
        message: { type: "string", description: "متن پیام (اختیاری)" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
];

/* ---------- اجرای ابزارها ---------- */
function runTool(name, args) {
  switch (name) {
    case "list_products":
      return {
        store: STORE.brand,
        purity: STORE.purity,
        categories: PRODUCTS,
        note: "قیمت‌ها روزانه بر اساس نرخ نقره تغییر می‌کنند؛ استعلام از واتساپ فروشگاه.",
      };

    case "get_store_info":
      return {
        brand: STORE.brand,
        tagline: STORE.tagline,
        city: STORE.city,
        silver_purity: STORE.purity,
        about: STORE.about,
        website: STORE.website,
      };

    case "get_contact":
      return {
        phone: STORE.phone,
        phone_display: STORE.phoneDisplay,
        whatsapp: STORE.whatsapp,
        address: STORE.address,
        website: STORE.website,
      };

    case "request_consultation": {
      const name_ = String(args?.name || "").trim();
      if (!name_) {
        return { error: "پارامتر name (نام درخواست‌دهنده) الزامی است." };
      }
      const lines = [`سلام، ${name_} هستم.`];
      if (args?.phone) lines.push(`شماره تماس: ${String(args.phone).trim()}`);
      if (args?.topic) lines.push(`موضوع: ${String(args.topic).trim()}`);
      lines.push(String(args?.message || "درخواست مشاوره دارم.").trim());
      const text = lines.join("\n");
      return {
        whatsapp_link: `${STORE.whatsapp}?text=${encodeURIComponent(text)}`,
        message_preview: text,
        instruction:
          "این لینک را به کاربر نشان دهید؛ با باز کردن آن، پیام آماده در واتساپ فروشگاه ارسال می‌شود.",
      };
    }

    default:
      return null;
  }
}

/* ---------- JSON-RPC / MCP ---------- */
function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function handleRpc(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested)
        ? requested
        : SUPPORTED_PROTOCOLS[1];
      return rpcResult(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "سرور MCP فروشگاه زیورآلات نقره SilvershopIR اصفهان. " +
          "با list_products محصولات، با get_contact راه‌های تماس و با request_consultation لینک مشاوره واتساپ بگیرید.",
      });
    }

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const name = params?.name;
      const args = params?.arguments || {};
      const tool = TOOLS.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32602, `ابزار ناشناخته: ${name}`);
      try {
        const out = runTool(name, args);
        const isError = !!(out && out.error);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
          isError,
        });
      } catch (e) {
        return rpcResult(id, {
          content: [{ type: "text", text: `خطای داخلی ابزار: ${e.message}` }],
          isError: true,
        });
      }
    }

    default:
      // نوتیفیکیشن‌ها (بدون id) پاسخ نمی‌خواهند
      if (id === undefined || id === null) return null;
      return rpcError(id, -32601, `متد پشتیبانی نمی‌شود: ${method}`);
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // صفحه راهنما در ریشه
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        `${STORE.brand} MCP Server\nEndpoint: POST ${url.origin}/mcp\nTools: ${TOOLS.map((t) => t.name).join(", ")}\n`,
        { headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } }
      );
    }

    if (url.pathname !== "/mcp") {
      return new Response("Not Found", { status: 404, headers: CORS });
    }

    // حالت stateless: استریم GET لازم نیست
    if (request.method === "GET") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    let msg;
    try {
      msg = await request.json();
    } catch {
      return Response.json(rpcError(null, -32700, "JSON نامعتبر"), {
        status: 400,
        headers: CORS,
      });
    }

    if (Array.isArray(msg)) {
      return Response.json(rpcError(null, -32600, "درخواست دسته‌ای پشتیبانی نمی‌شود"), {
        status: 400,
        headers: CORS,
      });
    }

    const res = handleRpc(msg);
    if (res === null) {
      // نوتیفیکیشن پذیرفته شد
      return new Response(null, { status: 202, headers: CORS });
    }
    return Response.json(res, {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  },
};
