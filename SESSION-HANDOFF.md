# נקודת המשך — סוף סשן 2026-04-21

> מסמך זה הוא **סימנייה** לסשן הבא. פותחים אותו ראשונים בפעם הבאה שחוזרים לעבודה.

---

## 🎯 איפה אנחנו עומדים

### ✅ נסגר בסשן הזה
- נוצר [BACKUP-ROUTINE.md](BACKUP-ROUTINE.md) — שגרת גיבוי שבועית ומדריך חירום.
- הוגשה בקשת KYC ב-Lemon Squeezy — **סטטוס: In Review**.
- הוגדרה חנות Lemon Squeezy (שם, מטבע ILS, Apple Pay + Google Pay, אימייל madbekaapp@gmail.com).
- אומת שהמוצר "Madbeka — Full Access" ב-₪35 כבר קיים ופועל במצב Test.
- אומת שה-Webhook פועל: רכישת בדיקה אמיתית עברה עם `200 {"ok":true}`.
- **שופרה מהירות יצירת המדבקה:**
  - מודל הוחלף מ-`isnet` ל-`isnet_fp16` → פי 2 מהיר
  - נוספה טעינה מוקדמת של המודל ברקע בעת טעינת הדף
  - צפי: מדבקה שלקחה 10-15 שניות → 4-6 שניות

### 🟡 ממתין (לא תלוי בנו)
- **אישור KYC** — 1-3 ימי עסקים. Lemon Squeezy ישלחו מייל לכתובת madbekaapp@gmail.com.

### ❌ חוסם השקה (חייב להסתיים לפני פרסום)
- **מעבר Lemon Squeezy ל-Live Mode** — מחכה לאישור KYC.

---

## 📋 הצעד הבא בדיוק (כשחוזרים לעבודה)

### אם KYC אושר (הגיע מייל אישור):
1. להיכנס ל-Lemon Squeezy → להפעיל את מתג **Live Mode** למעלה
2. **ליצור מחדש את המוצר** ב-Live (Test ו-Live נפרדים):
   - שם: `Madbeka — Full Access`
   - מחיר: `35` ILS
   - סוג: Single Payment
3. **Share → Copy checkout URL** — זה הקישור החדש (שונה מה-Test)
4. **Settings → Webhooks → + Add webhook:**
   - URL: `https://madbekaapp.co.il/api/lemon/webhook`
   - Secret: Generate חדש (**חדש ושונה** מה-Test)
   - Events: `order_created` + `order_refunded` בלבד
5. **Vercel → Settings → Environment Variables → Production:**
   - עדכן `LEMON_SQUEEZY_WEBHOOK_SECRET` עם ה-Secret החדש
   - עדכן `NEXT_PUBLIC_LEMON_CHECKOUT_URL` עם ה-Checkout URL החדש
6. **Vercel → Deployments → Redeploy** את הפריסה האחרונה
7. **בדיקה:** ליצור קופון 100% הנחה, לבצע רכישה אמיתית, לוודא:
   - ✅ הסימון נעלם מהמדבקות
   - ✅ ניתן ליצור יותר מ-3 מדבקות
   - ✅ מייל אישור הגיע
   - ✅ למחוק את הקופון אחרי הבדיקה

### אם KYC עוד לא אושר:
- להמשיך לחכות. אין מה לעשות ב-Lemon Squeezy.
- בינתיים אפשר לבדוק את שיפור המהירות של המדבקות (ראה סעיף הבא).

---

## 🧪 בדיקה חשובה לעשות בסשן הבא

**אחרי ה-Commit של שיפור המהירות — חובה לבדוק בפועל:**
1. להריץ `npm run dev`
2. לנקות cache של הדפדפן (DevTools → Network → Clear)
3. להעלות תמונה ולמדוד זמן
4. **לבדוק איכות** עם 3 סוגי תמונות:
   - תמונה עם שיער/פרווה עדינים
   - תמונה עם רקע מורכב
   - תמונה רגילה
5. **אם האיכות נפגעה באופן מורגש** → להחזיר את המודל ל-`isnet` בקובץ [sticker-maker.tsx](src/components/sticker-maker.tsx) שורות ~167 ו-~154.

---

## 📂 קבצים שהשתנו בסשן הזה

- `src/components/sticker-maker.tsx` — שינוי מודל + הוספת preload
- `BACKUP-ROUTINE.md` — נוצר
- `SESSION-HANDOFF.md` — זה, נוצר

הכל נשמר בגיט.

---

## 📌 קריאה מומלצת בתחילת הסשן הבא

1. קרא את המסמך הזה (`SESSION-HANDOFF.md`) — כדי לדעת איפה נעצרנו
2. קרא את [PROJECT.md](PROJECT.md) — לרענון הזיכרון על המוצר
3. אם שכחת משהו על גיבויים → [BACKUP-ROUTINE.md](BACKUP-ROUTINE.md)
4. אם יש בעיה טכנית עם קלוד → אותו מסמך, חלק "אם קלוד לא עובד"

---

*סשן הסתיים: 2026-04-21*
