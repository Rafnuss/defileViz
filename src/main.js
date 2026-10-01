import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootswatch/dist/litera/bootstrap.min.css";
// Registers the data-api for collapse (navbar) and modal (settings)
import "bootstrap";

createApp(App).use(i18n).mount("#app");
