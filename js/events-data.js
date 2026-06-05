// Events data for /events.html
//
// This file is maintained by the `update-calendar` skill, which reads the
// upcoming events from the Pond's Discord and keeps the past list in sync with
// the numbered Pondcasts. You can also edit it by hand.
//
// upcoming[]:  events still to come (newest first is fine; the page sorts by date)
//   { date: "YYYY-MM-DD", time: "18:00 CET", title, desc, image, link, meet }
//   - image: local path under img/events/ (Discord cover URLs expire, so they
//            are downloaded into the repo). Optional — falls back to the logo.
//   - link:  the Discord event URL (for RSVP / "interested"). Optional.
//   - meet:  the Google Meet (or other) call link. Optional.
//
// past[]:  recorded events == the numbered Pondcasts on resources.html
//   { date: "YYYY-MM-DD", title, desc, youtube }
//   - youtube: the episode URL; its thumbnail is resolved automatically by
//              js/thumbs.js, so no image field is needed here.

var EVENTS = {
  upcoming: [
    {
      date: "2026-06-08",
      time: "16:30 CET",
      title: "☕ Monthly hangout",
      desc: "Miss the newsroom coffee-machine chat? Drop in for 45 minutes, no agenda — toss some ideas around and see what happens. Repeats the second Monday of the month.",
      image: "img/events/monthly-hangout.png",
      link: "https://discord.com/events/1406642598646513858/1463295825454170274",
      meet: "https://meet.google.com/bfd-yqzv-dns"
    },
    {
      date: "2026-06-16",
      time: "15:00 CET",
      title: "How to code anything",
      desc: "A re-run of our popular Dataharvest session. No coding knowledge needed — learn a simple, systematic approach to conversations, context and prompting so you can get an LLM to code anything.",
      image: "img/events/how-to-code-anything.png",
      link: "https://discord.com/events/1406642598646513858/1511303745370329088",
      meet: "https://meet.google.com/ofn-ssgz-zib"
    },
    {
      date: "2026-06-24",
      time: "14:30 CET",
      title: "Landscapes of data: a deep dive into maps",
      desc: "Jonathan and Ada on what makes a good map for your story — what works, what to watch for, and a hands-on look at QGIS, the best free mapping tool.",
      image: "img/events/landscapes-of-data-maps.png",
      link: "https://discord.com/events/1406642598646513858/1511274442091790346",
      meet: "https://meet.google.com/dft-kjqi-epf"
    }
  ],

  past: [
    {
      date: "2026-05-14",
      title: "Pondcast #5: Text embeddings and how to use them",
      desc: "What text embeddings are and how to put them to work in practice.",
      youtube: "https://www.youtube.com/watch?v=_teY3H-sK4I"
    },
    {
      date: "2026-04-17",
      title: "Pondcast #4: Finding Stories in health expenses data with Ada",
      desc: "Uncovering narratives and insights from healthcare expenditure data.",
      youtube: "https://www.youtube.com/watch?v=DWnYlMLeG-k"
    },
    {
      date: "2026-03-25",
      title: "Pondcast #3: Calculate CO2 emissions with Thomas Goorden",
      desc: "Discussing methods for measuring carbon dioxide emissions.",
      youtube: "https://www.youtube.com/watch?v=qE9GMVyRoEI"
    },
    {
      date: "2026-01-14",
      title: "Pondcast #2: Investigating kindergartens with Freja Wedenborg",
      desc: "What 350 evaluation reports reveal about inequality between Copenhagen neighbourhoods.",
      youtube: "https://www.youtube.com/watch?v=lvSleNCANkI"
    },
    {
      date: "2025-12-03",
      title: "Pondcast #1: Scraper blocking and how to get around it",
      desc: "Practical approaches when websites block your scraper.",
      youtube: "https://www.youtube.com/watch?v=1yCykgFrZz0"
    }
  ]
};
