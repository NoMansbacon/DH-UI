import { defineConfig } from "vitepress";

export default defineConfig({
  title: "DaggerHeart-UI Character Sheets",
  description: "Build rich Daggerheart character sheets in Obsidian using live UI blocks.",
  base: "/Daggerheart-UI/",
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/USAGE" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Usage Guide", link: "/USAGE" },
        ],
      },
      {
        text: "Character Sheet",
        items: [
          { text: "Code Blocks Overview", link: "/blocks" },
          { text: "Traits", link: "/blocks/traits-abilities" },
          { text: "Vitals & Trackers", link: "/vitals%20and%20damage/vitals-trackers" },
          { text: "Rest", link: "/events/rest" },
          { text: "Full Heal & Reset All", link: "/events/heal-reset" },
          { text: "Level Up", link: "/events/levelup" },
          { text: "Damage", link: "/vitals%20and%20damage/damage" },
        ],
      },
      {
        text: "Resources & Inventory",
        items: [
          { text: "Consumables", link: "/blocks/consumables" },
          { text: "Domain Picker", link: "/Pickers/domain-picker" },
          { text: "Equipment Picker", link: "/Pickers/equipment-picker" },
        ],
      },
      {
        text: "Display & Story",
        items: [
          { text: "Badges", link: "/blocks/badges" },
          { text: "Features", link: "/blocks/features" },
          { text: "Experiences", link: "/blocks/experiences" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Sorcerer (Primal Origin)", link: "/examples/sorcerer" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Dynamic Content", link: "/concepts/dynamic-content" },
          { text: "State Storage", link: "/concepts/state-storage" },
{ text: "Events", link: "/concepts/events" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://NoMansbacon.github.io/DaggerHeart-UI/" },
    ],
  },
});
