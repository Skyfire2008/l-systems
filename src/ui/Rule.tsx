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

		return (<div className="rule">
			<input className="pred" value={pred} onChange={(e) => onChange(e.target.value, succ, odds)}></input>
			<div>&rarr;</div>
			<input value={succ} onChange={(e) => onChange(pred, e.target.value, odds)}></input>
			<input className="odds" type="number" min="0" value={odds} onChange={(e) => onChange(pred, succ, e.target.valueAsNumber)}></input>
			<div className="prob">{Math.floor(prob * 1000) / 10}%</div>
			<button onClick={onRemove}>Remove</button>
		</div>);
	};
}