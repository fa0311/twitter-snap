
echo "multiple_tweets_to_image" 
bin/dev.cmd https://x.com/elonmusk --session-type=browser -o "temp/{id}-{count}.{if-type:png:mp4:json:}"
