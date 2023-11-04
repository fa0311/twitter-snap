aria2c -x4 https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJKjp-hinted.zip
Expand-Archive NotoSansCJKjp-hinted.zip -DestinationPath ./assets
rm NotoSansCJKjp-hinted.zip
rm assets/NotoSansCJKjp-Black.otf
# rm assets/NotoSansCJKjp-Bold.otf
rm assets/NotoSansCJKjp-DemiLight.otf
rm assets/NotoSansCJKjp-Light.otf
rm assets/NotoSansCJKjp-Medium.otf
# rm assets/NotoSansCJKjp-Regular.otf
rm assets/NotoSansCJKjp-Thin.otf
rm assets/NotoSansMonoCJKjp-Bold.otf
rm assets/NotoSansMonoCJKjp-Regular.otf