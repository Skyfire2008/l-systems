namespace ui {

	export const App: React.FC<{}> = () => {

		const [name, setName] = React.useState("");
		const [axiom, _setAxiom] = React.useState("");
		const setAxiom = (newAxiom: string) => {
			sequence.current = newAxiom;
			_setAxiom(newAxiom);
		};

		const [delta, _setDelta] = React.useState(60);
		const setDelta = (newDelta: number) => {
			redraw();
			_setDelta(newDelta);
		}

		const [dist, _setDist] = React.useState(1);
		const setDist = (newDist: number) => {
			redraw();
			_setDist(newDist);
		}

		const [iterations, _setIterations] = React.useState(0);
		const setIterations = (newIterations: number) => {
			if (newIterations - iterations == 1) {
				//if iterations were iterated, only rewrite sequence once
				sequence.current = lSystem.rewrite(rulesDef, sequence.current);
			} else {
				sequence.current = axiom;
				for (let i = 0; i < newIterations; i++) {
					sequence.current = lSystem.rewrite(rulesDef, sequence.current);
				}
			}

			redraw();

			_setIterations(newIterations);
		}

		const [ruleList, setRuleList] = React.useState<Array<Rule>>([]);
		const rulesDef: lSystem.RulesDef = React.useMemo(() => {
			const result: lSystem.RulesDef = {};
			for (const rule of ruleList) {
				let ruleArray = result[rule.pred];
				if (ruleArray == null) {
					ruleArray = [];
					result[rule.pred] = ruleArray;
				}
				ruleArray.push({
					succ: rule.succ,
					prob: rule.prob,
					odds: rule.odds
				});
			}

			return result;
		}, [ruleList]);

		const canvasRef = React.useRef<HTMLCanvasElement>();
		const sequence = React.useRef<string>(axiom);
		const turtle = React.useRef(new lSystem.Turtle());

		const redraw = () => {
			const ctx = canvasRef.current.getContext("2d");
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 800, 800);
			turtle.current.draw(sequence.current, dist, Math.PI * delta / 180, ctx);
		};

		const onSelectFile = (file: ui.File) => {
			const system: lSystem.LSystem = JSON.parse(file.contents);
			setName(system.name);
			setAxiom(system.axiom);
			setDelta(system.delta);

			const newRuleList: Array<Rule> = [];
			for (const pred in system.rules) {
				const current = system.rules[pred];
				for (const rule of current) {
					newRuleList.push({ ...rule, pred });
				}
			}
			setRuleList(newRuleList);
		};

		const onChangeRule = (i: number, pred: string, succ: string, odds: number) => {
			const old = ruleList[i];
			old.succ = succ;

			//if odds changed, need to recalculate probabilities of this rule as well as all related ones
			if (old.odds != odds) {
				old.odds = odds;
				let totalOdds = 0;
				const predRules: Array<Rule> = [];
				for (const rule of ruleList) {
					if (rule.pred == old.pred) {
						totalOdds += rule.odds;
						predRules.push(rule);
					}
				}

				for (const rule of predRules) {
					rule.prob = rule.odds / totalOdds;
				}
			}

			if (old.pred != pred) {
				old.pred = pred;
				ruleList.sort((a, b) => a.pred.localeCompare(b.pred));
			}

			setRuleList(ruleList.slice(0));
		};

		const onAddRule = () => {
			ruleList.push({
				pred: "",
				succ: "",
				odds: 0,
				prob: 0
			});
			setRuleList(ruleList.slice(0));
		}

		return (<div>
			<ui.FileUpload label="Select the l-system file" accept="json" callback={onSelectFile}></ui.FileUpload>
			<div>
				<label>Axiom:</label>
				<input value={axiom} onChange={(e) => setAxiom(e.target.value)}></input>
			</div>
			<div>
				<label>Delta:</label>
				<input type="number" value={delta} onChange={(e) => setDelta(e.target.valueAsNumber)}></input>
			</div>
			<div>
				<label>Dist:</label>
				<input min={0} type="number" value={dist} onChange={(e) => setDist(e.target.valueAsNumber)}></input>
			</div>
			<div>
				<label>Iterations:</label>
				<input min={0} type="number" value={iterations} onChange={(e) => setIterations(e.target.valueAsNumber)}></input>
			</div>
			<div>
				<button onClick={onAddRule}>Add Rule</button>
				Rules:
				{ruleList.map((rule, i) => <Rule {...rule} key={i} callback={onChangeRule.bind(null, i)}></Rule>)}

			</div>
			<canvas ref={canvasRef} width="800" height="800"></canvas>
		</div>);
	};
}