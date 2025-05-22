window.onload = () => {
	const root = (ReactDOM as any).createRoot(document.getElementById("app"));

	root.render(
		<ui.App></ui.App>
	);
};