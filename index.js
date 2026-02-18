import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import { I18nManager } from "react-native";

// Allow the layout to mirror for RTL languages — must be set before any render
I18nManager.allowRTL(true);

import App from "./App";

registerRootComponent(App);
