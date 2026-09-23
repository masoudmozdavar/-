import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { parseBankSmsLocally } from './src/utils/bankSmsParser';

function geminiBankSmsPlugin(): Plugin {
  return {
    name: 'gemini-bank-sms-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/gemini/parse-sms') || req.url.startsWith('/api/bank-sms/parse'))) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsedBody = JSON.parse(body || '{}');
                const smsText = (parsedBody.smsText || parsedBody.text || '').trim();

                if (!smsText) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ success: false, error: 'متن پیامک خالی است.' }));
                }

                // First fallback is our smart local parser
                const localResult = parseBankSmsLocally(smsText);

                // Attempt Gemini API if key is present
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  return res.end(JSON.stringify({
                    success: true,
                    source: 'smart-heuristic',
                    note: 'کلید جمنای تنظیم نشده است؛ تحلیل با موتور هوشمند محلی انجام شد.',
                    data: localResult
                  }));
                }

                try {
                  const ai = new GoogleGenAI({
                    apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build',
                      }
                    }
                  });

                  const prompt = `شما یک هوش مصنوعی تحلیل‌گر پیامک‌های بانکی سیستم‌های بانکی ایران (شتاب/شاپرک) هستید.
متن پیامک بانکی زیر را تحلیل کرده و اطلاعات تراکنش را دقیقا در قالب شیء JSON با کلیدهای زیر برگردان:
1. amount: مبلغ خالص تراکنش به واحد تومان (عدد صحیح بدون کاما؛ اگر به ریال بود تقسیم بر ۱۰ کن).
2. originalAmountString: متن اصلی مبلغ با پسوند (مثلا "۴۵۰,۰۰۰ ریال" یا "۱۲۵,۰۰۰ تومان").
3. currencyUnit: "rial" یا "toman".
4. type: یکی از سه مقدار "expense" (برداشت، خرید، انتقال به دیگری)، "income" (واریز، حقوق، شارژ)، "transfer" (کارت به کارت بین‌بانکی).
5. merchantName: نام فروشگاه، پذیرنده، مقصد، یا شخص (مثلا "افق کوروش", "اسنپ", "داروخانه دکتر کریمی", "علی رضایی"). اگر مشخص نبود، نام خدمت یا بانک.
6. bankName: نام بانک ایرانی (مثلا "بانک سامان", "بانک ملت", "بلو بانک", "بانک ملی", "بانک پاسارگاد", "بانک رسالت").
7. cardOrAccount: شماره کارت یا حساب (مثلا "6219****8219").
8. jalaliDate: تاریخ شمسی به فرمت "YYYY/MM/DD" (مثلا 1403/07/02). اگر سال درج نشده بود از سال جاری استفاده کن.
9. time: ساعت به فرمت HH:mm (مثلا 18:24).
10. trackingCode: کد پیگیری، شماره ارجاع یا شناسه تراکنش در صورت وجود.
11. balanceAfter: مانده حساب بعد از تراکنش به تومان (در صورت ذکر در پیامک).
12. suggestedCategory: یکی از: "cat_food", "cat_transport", "cat_shopping", "cat_bills", "cat_health", "cat_salary", "cat_housing", "cat_installments", "cat_other".
13. suggestedCategoryNameFa: نام فارسی دسته (مثلا "خوراک و سوپرمارکت", "حمل و نقل و خودرو", "سلامت و درمان", "قبوض و ارتباطات", "خرید و بازار", "حقوق و دستمزد").
14. description: یک شرح خلاصه و شکیل برای ثبت در گزارش تراکنش‌ها.

متن پیامک:
"""
${smsText}
"""
`;

                  let response;
                  try {
                    response = await ai.models.generateContent({
                      model: 'gemini-3.8-flash',
                      contents: prompt,
                      config: {
                        responseMimeType: 'application/json',
                        temperature: 0.1,
                      }
                    });
                  } catch (geminiError: any) {
                    console.warn('Gemini 3.8-flash retry with 3.1-flash-lite due to:', geminiError?.message || geminiError);
                    response = await ai.models.generateContent({
                      model: 'gemini-3.1-flash-lite',
                      contents: prompt,
                      config: {
                        responseMimeType: 'application/json',
                        temperature: 0.1,
                      }
                    });
                  }

                  const rawJsonText = response?.text?.trim() || '{}';
                  const cleanedJson = rawJsonText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
                  const geminiData = JSON.parse(cleanedJson);

                  // Merge with fallback to ensure no required field is missing
                  const finalData = {
                    amount: typeof geminiData.amount === 'number' && geminiData.amount > 0 ? geminiData.amount : localResult.amount,
                    originalAmountString: geminiData.originalAmountString || localResult.originalAmountString,
                    currencyUnit: geminiData.currencyUnit || localResult.currencyUnit,
                    type: geminiData.type || localResult.type,
                    merchantName: geminiData.merchantName || localResult.merchantName,
                    bankName: geminiData.bankName || localResult.bankName,
                    cardOrAccount: geminiData.cardOrAccount || localResult.cardOrAccount,
                    jalaliDate: geminiData.jalaliDate || localResult.jalaliDate,
                    gregorianDate: localResult.gregorianDate,
                    time: geminiData.time || localResult.time,
                    trackingCode: geminiData.trackingCode || localResult.trackingCode,
                    balanceAfter: typeof geminiData.balanceAfter === 'number' ? geminiData.balanceAfter : localResult.balanceAfter,
                    suggestedCategoryId: geminiData.suggestedCategory || localResult.suggestedCategoryId,
                    suggestedCategoryNameFa: geminiData.suggestedCategoryNameFa || localResult.suggestedCategoryNameFa,
                    description: geminiData.description || localResult.description,
                    confidence: 0.98,
                    source: 'gemini-ai' as const
                  };

                  res.statusCode = 200;
                  return res.end(JSON.stringify({
                    success: true,
                    source: 'gemini-ai',
                    data: finalData
                  }));
                } catch (aiErr: any) {
                  console.warn('Gemini AI parse failed, using smart local parser fallback:', aiErr?.message || aiErr);
                  res.statusCode = 200;
                  return res.end(JSON.stringify({
                    success: true,
                    source: 'smart-heuristic',
                    note: 'تحلیل با الگوریتم هوشمند بومی به دلیل محدودیت موقت سرور هوش مصنوعی',
                    data: localResult
                  }));
                }
              } catch (e: any) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'خطا در پردازش درخواست: ' + (e?.message || '') }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

function familyApiPlugin(): Plugin {
  let inMemoryTransactions: any[] = [];
  let inMemoryRequests: any[] = [];
  let inMemoryMembers: any[] = [];

  return {
    name: 'family-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/family/')) {
          const url = req.url.split('?')[0];
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
          }

          if (url === '/api/family/state' && req.method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({
              transactions: inMemoryTransactions,
              requests: inMemoryRequests,
              members: inMemoryMembers,
              timestamp: Date.now()
            }));
          }

          if (url === '/api/family/sync' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                if (data.transactions && Array.isArray(data.transactions)) {
                  const txMap = new Map();
                  [...inMemoryTransactions, ...data.transactions].forEach(tx => {
                    if (tx && tx.id) txMap.set(tx.id, tx);
                  });
                  inMemoryTransactions = Array.from(txMap.values());
                }
                if (data.requests && Array.isArray(data.requests)) {
                  const reqMap = new Map();
                  [...inMemoryRequests, ...data.requests].forEach(r => {
                    if (r && r.id) reqMap.set(r.id, r);
                  });
                  inMemoryRequests = Array.from(reqMap.values());
                }
                if (data.members && Array.isArray(data.members)) {
                  const memMap = new Map();
                  [...inMemoryMembers, ...data.members].forEach(m => {
                    if (m && m.id) memMap.set(m.id, m);
                  });
                  inMemoryMembers = Array.from(memMap.values());
                }
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  transactions: inMemoryTransactions,
                  requests: inMemoryRequests,
                  members: inMemoryMembers,
                  timestamp: Date.now()
                }));
              } catch (e) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }

          if (url === '/api/family/transaction' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const tx = JSON.parse(body || '{}');
                if (tx && tx.id) {
                  inMemoryTransactions = [tx, ...inMemoryTransactions.filter(t => t.id !== tx.id)];
                }
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, transaction: tx }));
              } catch (e) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }

          if (url === '/api/family/request' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const r = JSON.parse(body || '{}');
                if (r && r.id) {
                  inMemoryRequests = [r, ...inMemoryRequests.filter(item => item.id !== r.id)];
                }
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, request: r }));
              } catch (e) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), familyApiPlugin(), geminiBankSmsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
