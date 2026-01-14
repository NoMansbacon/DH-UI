import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Daggerheart Tooltips (DH-UI)",
  description: "Build rich Daggerheart character sheets in Obsidian using live UI blocks.",
  base: "/DH-UI/",
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
          { text: "Traits & Abilities", link: "/blocks/traits-abilities" },
          { text: "Vitals & Trackers", link: "/vitals%20and%20damage/vitals-trackers" },
          { text: "Rest & Level Up", link: "/events/rest" },
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
        text: "Concepts",
        items: [
          { text: "Templates & Events", link: "/events/templates-events" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/NoMansbacon/DH-UI" },
    ],
  },
});
