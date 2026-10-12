# Hadith promo video – ইসলামী বিশ্বকোষ ও আল হাদিস S2

Renders a timed Bengali promo / explainer video from **HTML + CSS + JavaScript + SVG** with **Playwright (Chromium) + FFmpeg**, entirely inside **GitHub Actions**. Nothing to install on your phone or PC.

Two themes live in the same repo and use the same `timestamps.txt`, logo and audio:

| Theme | File | Size | What you get |
|---|---|---|---|
| `infographic` | `index-infographic.html` | 1080 x 1920 (9:16) | big logo, cards / counters, reactive caption panel, no presenter |
| `podcast` | `index-podcast.html` | 1920 x 1080 (16:9) | illustrated host in a studio, wall screen with the visuals, ON AIR sign, reactive caption lower third |

## Files

```
index-infographic.html   theme A
index-podcast.html       theme B
render.js                Playwright + FFmpeg renderer
package.json             only dependency: playwright
timestamps.txt           your script (start | end | text | mood) - unchanged
audio.mp3                narration / background sound (optional)
assets/logo.jpg          your logo
assets/google-play-badge.jpg   official Google Play badge (only used if a line mentions the Play Store)
assets/fonts/            SolaimanLipi-Regular.ttf / SolaimanLipi-Bold.ttf (downloaded by the workflow if missing)
.github/workflows/render.yml
```

## Steps from a phone (browser only)

1. On github.com create a new repository (public repos have free Actions minutes).
2. **Add file -> Upload files** and upload everything from this zip. GitHub's web upload keeps folders when you drag a folder; if your phone browser only lets you pick single files, first use *Add file -> Create new file*, type `assets/x` as the name (this creates the folder), then upload the files into `assets/`, `assets/fonts/` and `.github/workflows/`.
3. (Optional) If you want to be sure the Bengali font is used, upload `SolaimanLipi-Regular.ttf` and `SolaimanLipi-Bold.ttf` into `assets/fonts/`. If they are missing, the workflow tries to download them; if that fails you get a yellow warning and Bengali falls back to Noto Serif / Sans Bengali.
4. Put your narration in the repo root as `audio.mp3` (`.wav`, `.m4a`, `.aac` also work). No audio file = silent video.
5. Open **Actions -> Render Video -> Run workflow**. Choose the theme (`podcast`, `infographic` or `both`), `quality = preview` first (half size, 15 fps, a few minutes), check it, then run again with `quality = full` (full size, 30 fps).
6. When the run is green open it and download **video** under *Artifacts* (zip containing the `.mp4`). Artifacts are kept 14 days.

## Environment variables for `render.js` (the workflow sets them)

| Variable | Default | Meaning |
|---|---|---|
| `THEME` | `podcast` | `podcast` or `infographic` |
| `WIDTH` | 1920 / 1080 | output width; the page is always laid out at the design size and scaled |
| `FPS` | 30 | frames per second |
| `OUT` | `out/video-<theme>.mp4` | output file |
| `START`, `END` | 0, end | render only a part (for quick tests) |
| `AUDIO_VOLUME` | 1.0 | audio gain |

## How it works

* Every page is a pure function of time: `window.init(raw, opts)` builds the DOM and returns the duration (last end + 0.5 s), `window.fit()` shrinks captions until they fit, `window.seek(t)` sets every style for time `t`, `window.setAudio(envelope, fps)` feeds the loudness. No CSS animations, timers, `requestAnimationFrame`, `Date.now`, `Math.random` or remote URLs, so every render is identical.
* `render.js` loops over frames: `seek(t)` -> JPEG screenshot -> FFmpeg (`libx264`, crf 18, yuv420p, faststart).
* Audio: decoded to mono 22.05 kHz, RMS per frame, normalised by the 95th percentile, smoothed (attack 0.6 / release 0.18). The envelope drives the panel glow, equaliser bars, logo glow, star pattern and (theme B) the screen, ON AIR sign, head, mouth and arm. Audio is muxed with `-stream_loop -1` (loops when shorter than the video), fade in 1.5 s (only when `START=0`), fade out 2 s, no `-shortest`.
* Karaoke captions: each word is timed by its length (characters + 1) across the scene. This is an **estimate** of the speech. Exact lip-sync and word timing would need phoneme / word alignment data; the host's mouth follows the estimated word timing and the real loudness.

## Scene design (automatic, from the text of each line)

* Greeting line -> Arabic calligraphy (السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ).
* Lines that are transliterations of the two Arabic hadith sentences -> the Arabic text (rules in `CONTENT.arabic` inside the HTML files; edit or delete them there).
* Lists (comma / "ও" / "এবং" items, max 3) -> cards with an emoji, sliding in.
* Numbers, written in digits or Bengali words -> a counter (localised digits). Example conversions: `এক` = ১, `দুজন` = ২, `দুই লাখ সত্তর হাজার তিনশ পঁয়ত্রিশ` = ২,৭০,৩৩৫.
* A line that mentions the Play Store (প্লে স্টোর, Google Play ...) -> store scene. With `assets/google-play-badge.*` it shows the official badge; without it a neutral gold button (no logo is ever drawn).
* Last line -> three closing emoji (and the logo comes back).
* Everything else -> the mood-coloured glow plus a small decorative ornament / emoji.
* Mood -> glow colour: respectful, happy, informative, excited, calm, enthusiastic. Other words are mapped to the nearest one (`solemn` and `serious` -> respectful, `thoughtful` and `compassionate` -> calm, `warm` and `friendly` -> happy, `optimistic` and `encouraging` -> enthusiastic); anything unknown becomes `happy`.
* `❝ name ❞` markers in a line highlight that name in gold (and mark a brand scene).

## Store badge rule

The renderer never draws or imitates third-party logos. Get the official badge from <https://developer.android.com/distribute/tools/promote/badges> and upload it as `assets/google-play-badge.png` (`.webp`, `.svg`, `.jpg` also accepted).

## Host (theme B)

The presenter is an original flat SVG illustration (warm brown skin, white topi, beard, round glasses, headphones with boom mic, cream kurta with gold collar). It is not a real person or a known character. For a faceless host set `const FACELESS = true;` at the top of the script in `index-podcast.html` (no eyes / mouth, sound-wave arcs near the microphone).
