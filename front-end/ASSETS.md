# Blue, the Aster study companion

Created with the built-in image generation tool on 19 September 2026.

Project asset: `public/assets/blue-dinosaur.png`. The image has a transparent background and is reused in the learning path, welcome card, teach-back activities, and review results.

Final generation prompt:

> Use case: illustration-story. Asset type: transparent mascot PNG for a friendly school revision web app. Primary request: one original adorable BLUE DINOSAUR mascot, full body, standing upright in a cheerful encouraging pose and waving one little arm. Simple chunky rounded flat vector-like illustration, polished playful education app character, oversized rounded head, big kind white eyes with dark navy pupils, small smile, two little visible teeth, a chubby sky-blue body, lighter ice-blue belly, cobalt-blue small back spikes, short little legs and rounded tail. All parts a harmonious BLUE palette; not green. Subtle two-tone cel shading, clean silhouette readable at 120px, no outlines or minimal dark blue outlines. Center character with comfortable padding, face in three-quarter view looking toward viewer. Transparent background with actual alpha. No text, no letters, no logo, no watermark, no props, no scene, no extra characters. Friendly and appealing for a grade 8 student, not a baby toy, not frightening. 1024x1024 square.

Interface icons: Lucide. Typefaces: DM Sans and Manrope through Google Fonts, with a system sans-serif fallback.


## Additional poses

`public/assets/blue-reading.png`: generated with the built-in image-generation tool using the original dinosaur as a reference. Direction: keep the same blue dinosaur identity, seated with a mint book and a short stack of coral and mint books, friendly three-quarter pose, transparent background, polished soft illustration, no text. Gentle reading motion is implemented in CSS.

`public/assets/blue-wave-strip.png`: generated with the built-in image-generation tool using the original dinosaur as a reference. Direction: four equally spaced frames of the same blue dinosaur waving, stable scale and baseline, transparent background, changing arm positions, no text or extra characters. The 2172 x 724 strip is animated through CSS background positions when the mascot is clicked. Mascot sparkle particles use CSS; review rewards use a bounded canvas particle system with reduced-motion support.

## Book texts and artwork

The full original Project Gutenberg text files, including their credits and license notices, are preserved in `public/books/`. The in-app reader paginates the complete main text without abridging it.

- `a-christmas-carol.txt`: Charles Dickens, *A Christmas Carol*, Project Gutenberg #46, https://www.gutenberg.org/ebooks/46 (text source https://www.gutenberg.org/ebooks/46.txt.utf-8).
- `frankenstein.txt`: Mary Wollstonecraft Shelley, *Frankenstein*, Project Gutenberg #84, https://www.gutenberg.org/ebooks/84 (text source https://www.gutenberg.org/ebooks/84.txt.utf-8).
- `the-time-machine.txt`: H. G. Wells, *The Time Machine*, Project Gutenberg #35, https://www.gutenberg.org/ebooks/35 (text source https://www.gutenberg.org/ebooks/35.txt.utf-8).

These underlying works are public domain in Germany and the United States; Project Gutenberg notices remain in the distributed source files. The visible library contains only complete local text editions. Publisher-only and external-only catalogue records are retained as legacy metadata for saved-note compatibility but are not displayed as readable books. The library’s typographic covers, Aster star mark, population chart, and quadratic graph are original interface artwork, not publisher cover reproductions.


## Initial reader catalogue (20 September 2026)

The initial 22 local editions are listed below. The current expanded catalogue is recorded in [src/localLibrary.json](src/localLibrary.json), including edition source URLs, contributor credits, verification dates, and SHA-256 checksums. All visible library entries have a complete text file in public/books/; original source headers and licences are preserved.

- Alice’s Adventures in Wonderland — Lewis Carroll. File: public/books/11.txt. Source: https://www.gutenberg.org/ebooks/11
- Anne of Green Gables — L. M. Montgomery. File: public/books/45.txt. Source: https://www.gutenberg.org/ebooks/45
- The Secret Garden — Frances Hodgson Burnett. File: public/books/113.txt. Source: https://www.gutenberg.org/ebooks/113
- Treasure Island — Robert Louis Stevenson. File: public/books/120.txt. Source: https://www.gutenberg.org/ebooks/120
- The Wonderful Wizard of Oz — L. Frank Baum. File: public/books/55.txt. Source: https://www.gutenberg.org/ebooks/55
- The Adventures of Sherlock Holmes — Arthur Conan Doyle. File: public/books/1661.txt. Source: https://www.gutenberg.org/ebooks/1661
- Anne of Avonlea — L. M. (Lucy Maud) Montgomery. File: public/books/47.txt. Source: https://www.gutenberg.org/ebooks/47
- Anne of the Island — L. M. (Lucy Maud) Montgomery. File: public/books/51.txt. Source: https://www.gutenberg.org/ebooks/51
- The Prince and the Pauper — Mark Twain. File: public/books/1837.txt. Source: https://www.gutenberg.org/ebooks/1837
- The Book of Dragons — E. (Edith) Nesbit. File: public/books/23661.txt. Source: https://www.gutenberg.org/ebooks/23661
- The Phoenix and the Carpet — E. (Edith) Nesbit. File: public/books/836.txt. Source: https://www.gutenberg.org/ebooks/836
- The Story of the Amulet — E. (Edith) Nesbit. File: public/books/837.txt. Source: https://www.gutenberg.org/ebooks/837
- A Study in Scarlet — Arthur Conan Doyle. File: public/books/244.txt. Source: https://www.gutenberg.org/ebooks/244
- The Sign of the Four — Arthur Conan Doyle. File: public/books/2097.txt. Source: https://www.gutenberg.org/ebooks/2097
- The Happy Prince, and Other Tales — Oscar Wilde. File: public/books/902.txt. Source: https://www.gutenberg.org/ebooks/902
- The Canterville Ghost — Oscar Wilde. File: public/books/14522.txt. Source: https://www.gutenberg.org/ebooks/14522
- Northanger Abbey — Jane Austen. File: public/books/121.txt. Source: https://www.gutenberg.org/ebooks/121
- Mansfield Park — Jane Austen. File: public/books/141.txt. Source: https://www.gutenberg.org/ebooks/141
- As You Like It — William Shakespeare. File: public/books/1523.txt. Source: https://www.gutenberg.org/ebooks/1523
- A Christmas Carol — Charles Dickens. File: public/books/a-christmas-carol.txt. Source: https://www.gutenberg.org/ebooks/46
- Frankenstein — Mary Wollstonecraft Shelley. File: public/books/frankenstein.txt. Source: https://www.gutenberg.org/ebooks/84
- The Time Machine — H. G. Wells. File: public/books/the-time-machine.txt. Source: https://www.gutenberg.org/ebooks/35

The ten customizable buddies in src/components/buddy are original SVG artwork, animated with CSS. Library cover designs and arcade canvas artwork are original code-generated graphics.

Legacy modern-book metadata references Bloomsbury, Rick Riordan, Scholastic, and Penguin Random House. Those unavailable titles are hidden from the reading library. Their copyrighted texts and publisher covers are not distributed.


## Complete-edition import (3 October 2026)

The collection was expanded from Project Gutenberg’s [officially listed mirror](https://www.gutenberg.org/MIRRORS.ALL), using its machine-readable edition metadata and complete UTF-8 files. The manual importer rejects missing edition boundaries, unavailable files, and records whose contributor dates or reuse status could not be verified. Texts retain their original licences and credits. Book files load only when their reader opens.

## Learnify logo and science cards (4 October 2026)

The Learnify open-book / ascending-pages mark, wordmark composition and favicon are original vector identity artwork in `src/components/BrandLogo.jsx` and `public/favicon.svg`. Its animations and the experiment cards reuse [Motion for React](https://motion.dev/docs/react-animation) (MIT, already installed); gesture and spring APIs animate the existing elements. All science-card pictograms and controls come from [Lucide](https://lucide.dev/license) (ISC). No external gallery images, proprietary animation assets or third-party website designs were copied. Package licence notices remain in their dependencies.

The in-app school-document and competition-paper reader reuses [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) (Apache-2.0), including its bundled worker, to render original PDFs without depending on a native browser PDF plugin. Original documents retain their own notices.
