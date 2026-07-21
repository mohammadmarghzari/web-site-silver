# سرور MCP فروشگاه SilvershopIR

این پوشه یک **سرور MCP** (پروتکل اتصال هوش مصنوعی) کامل و آماده است که فروشگاه را به کلاینت‌های هوش مصنوعی مثل Claude وصل می‌کند. بدون هیچ وابستگی — یک فایل جاوااسکریپت روی Cloudflare Workers (رایگان).

## ابزارهایی که به هوش مصنوعی می‌دهد

| ابزار | کار |
|---|---|
| `list_products` | دسته‌های محصولات (انگشتر مردانه/زنانه، نیم‌ست) با توضیحات |
| `get_store_info` | معرفی برند، شهر، عیار نقره و داستان فروشگاه |
| `get_contact` | تلفن، واتساپ، آدرس نقش جهان و وب‌سایت |
| `request_consultation` | ساخت لینک آماده واتساپ برای مشاوره/استعلام قیمت |

## تست محلی (بدون نیاز به هیچ حسابی)

```bash
cd mcp-server
node test/test.mjs      # ۱۴ تست پروتکل و ابزارها
```

## دیپلوی رایگان روی Cloudflare (یک‌بار برای همیشه)

1. حساب رایگان بسازید: https://dash.cloudflare.com/sign-up
2. روی سیستم خودتان:
   ```bash
   cd mcp-server
   npm install
   npx wrangler login      # مرورگر باز می‌شود؛ اجازه دهید
   npx wrangler deploy
   ```
3. خروجی یک آدرس می‌دهد، مثل:
   `https://silvershop-mcp.<your-subdomain>.workers.dev`
4. آدرس MCP شما: **`https://silvershop-mcp.<your-subdomain>.workers.dev/mcp`**

## اتصال به Claude

- **claude.ai (وب):** Settings → Connectors → Add custom connector → آدرس بالا را وارد کنید.
- **Claude Desktop:** در `claude_desktop_config.json`:
  ```json
  {
    "mcpServers": {
      "silvershop": {
        "command": "npx",
        "args": ["-y", "mcp-remote", "https://silvershop-mcp.<your-subdomain>.workers.dev/mcp"]
      }
    }
  }
  ```

بعد از اتصال، از Claude بپرسید: «از فروشگاه silvershop چه محصولاتی داره؟» یا «برام وقت مشاوره بگیر» — هوش مصنوعی مستقیم از سرور فروشگاه جواب می‌گیرد.

## به‌روزرسانی داده‌ها

محصولات و اطلاعات تماس در ابتدای `src/index.js` (ثابت‌های `STORE` و `PRODUCTS`) هستند؛ بعد از هر تغییر، دوباره `npx wrangler deploy` بزنید.
