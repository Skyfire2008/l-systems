namespace ui {

	interface TooltipLabelProps {
		text: string;
		for?: string;
		children: string;
		extraClasses?: string;
	}

	export const TooltipLabel: React.FC<TooltipLabelProps> = (props) => {
		const className = props.extraClasses ? "tooltip-text " + props.extraClasses : "tooltip-text";
		const label = props.for != null ? <label htmlFor={props.for}>{props.children}</label> : <div>{props.children}</div>

		return (<div className="tooltip">
			{label}
			<div className={className}>{props.text}</div>
		</div>);
	};
}