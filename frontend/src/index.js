import React from "react"
import { createRoot } from "react-dom/client"
// import { Provider } from "react-redux"
// import { store } from './redux/store'
import "./index.css"
import App from "./App.jsx"
import * as serviceWorker from "./serviceWorker"

const container = document.getElementById("root")
if (container) {
	const root = createRoot(container)
	root.render(
		// <Provider store={store}>
		<React.StrictMode>
			<App />
		</React.StrictMode>
		// </Provider>
	)
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
