aria2c -x4 https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJKjp-hinted.zip
Expand-Archive NotoSansCJKjp-hinted.zip -DestinationPath ./tmp
mv tmp/NotoSansCJKjp-Bold.otf src/assets/NotoSansCJKjp-Bold.otf
mv tmp/NotoSansCJKjp-Regular.otf src/assets/NotoSansCJKjp-Regular.otf
mv tmp/LICENSE_OFL.txt src/assets/LICENSE_OFL.txt
rm tmp -r -fo
rm NotoSansCJKjp-hinted.zip -fo

aria2c -x4 https://github.com/twitter/twemoji/archive/refs/tags/v14.0.2.zip
Expand-Archive twemoji-14.0.2.zip -DestinationPath ./tmp
mv tmp/twemoji-14.0.2/assets/svg src/assets/twemoji
mv tmp/twemoji-14.0.2/LICENSE-GRAPHICS src/assets/LICENSE-GRAPHICS
mv tmp/twemoji-14.0.2/LICENSE src/assets/LICENSE


rm tmp -r -fo
rm twemoji-14.0.2.zip -fo

