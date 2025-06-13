namespace ui {

	interface ColorPaletteProps {
		colors: Array<string>;
		onColorChange: (colors: Array<string>) => void;
	}

	export const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, onColorChange }) => {

		const line0: Array<React.JSX.Element> = [];
		for (let i = 0; i < 5; i++) {
			const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
				colors[i] = e.target.value;
				onColorChange(colors.slice(0));
			};
			line0.push(<div key={i}>
				{i + ":"}
				<input type="color" value={colors[i]} onChange={onChange}></input>
			</div>);
		}

		const line1: Array<React.JSX.Element> = [];
		for (let i = 5; i < 10; i++) {
			const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
				colors[i] = e.target.value;
				onColorChange(colors.slice(0));
			};
			line1.push(<div key={i}>
				{i + ":"}
				<input type="color" value={colors[i]} onChange={onChange}></input>
			</div>);
		}

		return (<div>
			<div className="line">{line0}</div>
			<div className="line">{line1}</div>
		</div>);
	}
}