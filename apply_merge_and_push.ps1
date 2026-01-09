#!/usr/bin/env bash
set -euo pipefail

# Usage: ضع boit nano.zip في نفس الدليل هذا ثم شغّل:
# ./apply_merge_and_push.sh /path/to/boit\ nano.zip
ZIP_PATH="${1:-./boit nano.zip}"
REPO_DIR="${2:-./lol}"   # غير هذا إذا مجلد المستودع مختلف
BRANCH="main"
COMMIT_MSG="Merge uploaded bundle (boit nano) — unified publish-ready site"

if [ ! -f "$ZIP_PATH" ]; then
  echo "لم أجد الأرشيف: $ZIP_PATH"
  echo "ضع ملف boit nano.zip بجانب السكربت أو مرّر مساره كأول براميتر."
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "لم أجد مستودع Git في: $REPO_DIR"
  echo "الرجاء استنساخ المستودع djamelwaw6-beep/lol إلى هذا المسار أو مرّر المسار الصحيح كمُعامل ثانٍ."
  exit 1
fi

echo "1) الانتقال لمجلد المستودع: $REPO_DIR"
cd "$REPO_DIR"

# تأكد أن لديك صلاحية للكتابة إلى الفرع main
echo "2) سحب آخر تغييرات من origin/$BRANCH"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# عمل نسخة احتياطية محلية للملفات الحالية (backup)
BACKUP_DIR="../backup-pre-merge-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "3) إنشاء نسخة احتياطية من الملفات الحالية إلى: $BACKUP_DIR"
rsync -a --exclude='.git' ./ "$BACKUP_DIR/"

# فك الأرشيف مؤقتاً
TMPDIR="$(mktemp -d)"
echo "4) فك الأرشيف $ZIP_PATH إلى $TMPDIR"
unzip -q "$ZIP_PATH" -d "$TMPDIR"

# ننقل الملفات من الأرشيف إلى المستودع (استبدال)
echo "5) نسخ محتويات الأرشيف إلى المستودع (overwrite)"
rsync -a --delete --exclude='.git' "$TMPDIR/" "./"

# تأكد من أن meta gemini-api-key يبقى فارغاً أو كما تريده
# (لا نعبئ المفتاح هنا — حسب طلبك نتركه فارغاً)
echo "ملاحظة: لم يتم تغيير قيمة <meta name=\"gemini-api-key\"> — هي تركت فارغة كما طلبت."

# تنظيف مؤقت
rm -rf "$TMPDIR"

# التحقق من التغييرات وجلب الملفات الجديدة
echo "6) إضافة الملفات للـ Git وعمل commit"
git add -A
# تحقق إن لم يحدث تغيير
if git diff --cached --quiet; then
  echo "لا توجد تغييرات جديدة للحفظ. انتهى."
  exit 0
fi

git commit -m "$COMMIT_MSG"

# ادفع التغييرات إلى remote main
echo "7) دفع commit إلى origin/$BRANCH"
git push origin "$BRANCH"

echo "تم: التغييرات دُفعت إلى origin/$BRANCH"
echo "نسخة احتياطية من الحالة السابقة في: $BACKUP_DIR"