Write-Output "normal_tweets_to_image" 
bin/dev.cmd https://x.com/elonmusk/status/1349129669258448897 --session-type=file --cookiesFile="cookies.json"

Write-Output "normal_tweets_to_video"
bin/dev.cmd https://x.com/SpaceX/status/1768794901586804837 --session-type=file --cookiesFile="cookies.json"

Write-Output "normal_pixiv_to_image" 
bin/dev.cmd https://x.com/elonmusk/status/1349129669258448897 --session-type=file --cookiesFile="cookies.json"

Write-Output "normal_pixiv_to_video" 
bin/dev.cmd https://www.pixiv.net/artworks/124498022 --session-type=file --cookiesFile="cookies.json"

Write-Output "multiple_tweets_to_image" 
bin/dev.cmd https://x.com/elonmusk --session-type=file --cookiesFile="cookies.json"

Write-Output "normal_tweets_to_image_from_browser"
bin/dev.cmd https://x.com/elonmusk/status/1349129669258448897 --session-type=browser



