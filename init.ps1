aria2c -x4 https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJKjp-hinted.zip
Expand-Archive NotoSansCJKjp-hinted.zip -DestinationPath ./tmp
mv tmp/NotoSansCJKjp-Bold.otf assets/NotoSansCJKjp-Bold.otf
mv tmp/NotoSansCJKjp-Regular.otf assets/NotoSansCJKjp-Regular.otf
rm tmp -r -fo
rm NotoSansCJKjp-hinted.zip -fo

aria2c -x4 https://github.com/twitter/twemoji/archive/refs/tags/v14.0.2.zip
Expand-Archive twemoji-14.0.2.zip -DestinationPath ./tmp
mv tmp/twemoji-14.0.2/assets/svg assets/twemoji

rm tmp -r -fo
rm twemoji-14.0.2.zip -fo

