namespace ui {

	export interface Rule {
		pred: string;
		succ: string;
		odds: number;
		prob: number;
	}

	interface RuleProps extends Rule {
		callback: (pred: string, succ: string, odds: number) => void;
	}

	export const Rule: React.FC<RuleProps> = ({ pred, succ, odds, prob, callback }) => {

		return (<div className="rule">
			<input className="pred" value={pred} onChange={(e) => callback(e.target.value, succ, odds)}></input>
			&rarr;
			<input value={succ} onChange={(e) => callback(pred, e.target.value, odds)}></input>
			<input type="number" min="0" value={odds} onChange={(e) => callback(pred, succ, e.target.valueAsNumber)}></input>
		</div>);
	};
}