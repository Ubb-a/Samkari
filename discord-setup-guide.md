# دليل إعداد البوت في Discord Developer Portal

المشكلة الحالية: البوت لا يستجيب للأوامر لأن "Message Content Intent" غير مفعل.

## خطوات الحل:

### 1. الدخول إلى Discord Developer Portal
- اذهب إلى: https://discord.com/developers/applications
- اختر التطبيق الخاص بالبوت

### 2. تفعيل Message Content Intent
- اذهب إلى قسم "Bot" في الشريط الجانبي
- ابحث عن قسم "Privileged Gateway Intents"
- فعّل "MESSAGE CONTENT INTENT"
- احفظ التغييرات

### 3. إعادة تشغيل البوت
البوت سيعيد تشغيل نفسه تلقائياً بعد التغيير.

### 4. إنشاء رابط دعوة البوت
- اذهب إلى قسم "OAuth2" → "URL Generator"
- اختر "bot" من الـ Scopes
- اختر الصلاحيات التالية من Bot Permissions:
  - Send Messages
  - Read Message History
  - Use Slash Commands
  - Manage Roles (للمشرفين فقط)
- انسخ الرابط المُنشأ واستخدمه لدعوة البوت

## اختبار البوت:
بعد دعوة البوت للسيرفر، جرب:
- `!help` - لعرض دليل الأوامر
- `!create test role:@everyone` - لإنشاء رود ماب تجريبية