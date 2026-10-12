# ইসলামী বিশ্বকোষ ও আল হাদিস S2 - Video Repo
Flat repo, no subfolders except .github/workflows

## ফাইল ম্যাপ
- index-infographic.html / index-podcast.html : shell
- common-*.js / css : shared
- a-* : vertical 9:16
- b-* : podcast 16:9
- tool-*.js : render
- render.js : entry
- project.json, scenes.json, timestamps.txt
- logo.png, google-play-badge.png

## ফোনে রেন্ডার
1. GitHub এ নতুন public repo বানান
2. সব ফাইল root এ Upload (Add file -> Upload files)
3. .github/workflows/render.yml ফাইলটি Create new file দিয়ে বানান, পুরো পাথ টাইপ করুন
4. অডিও থাকলে mp3 root এ দিন
5. Actions -> Render Video -> Run workflow -> theme বেছে নিন (podcast / infographic / both)
6. শেষে Artifacts থেকে video-*.mp4 ডাউনলোড করুন

## শেষের দৃশ্য
78.00 | 82.00 | আজই প্লে ষ্টোর থেকে ইনষ্টল করুন ❝ইসলামী বিশ্বকোষ ও আল হাদিস S2❞ আ্যপটি | store
এই সিনে লোগো বড় করে + Google Play ব্যাজ + টেক্সট দেখাবে এবং END_PAD 2s ধরে থাকবে।
