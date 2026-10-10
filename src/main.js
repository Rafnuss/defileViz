import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
// Registers the data-api for the settings modal
import "bootstrap";

createApp(App).use(i18n).mount("#app");
