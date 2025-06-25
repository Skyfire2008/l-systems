namespace ui {

	export interface Rule {
		pred: string;
		succ: string;
		odds: number;
		prob: number;
	}

	interface RuleProps extends Rule {
		onChange: (pred: string, succ: string, odds: number) => void;
		onRemove: () => void;
	}

	export const Rule: React.FC<RuleProps> = ({ pred, succ, odds, prob, onChange, onRemove }) => {
		//const ref= React.useRef<HTMLInputElement>();
		const onPredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value, succ, odds);
			e.target.blur();
		};

		return (<div className="rule">
			<input className="pred" value={pred} onChange={onPredChange}></input>
			<div>&rarr;</div>
			<input className="succ" value={succ} onChange={(e) => onChange(pred, e.target.value, odds)}></input>
			<input type="number" min="0" value={odds} onChange={(e) => onChange(pred, succ, e.target.valueAsNumber)}></input>
			<div className="prob">{Math.floor(prob * 1000) / 10}%</div>
			<button onClick={onRemove}>Remove</button>
		</div>);
	};
}