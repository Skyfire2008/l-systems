namespace ui {

	export const App: React.FC<{}> = () => {

		const [name, setName] = React.useState("");
		const [axiom, _setAxiom] = React.useState("");
		const [sequence, setSequence] = React.useState(axiom);

		const setAxiom = (newAxiom: string) => {
			setSequence(newAxiom);
			_setAxiom(newAxiom);
		};

		const [turnAngle, setTurnAngle] = React.useState(60);
		const [turnScale, setTurnScale] = React.useState(1);
		const [dist, setDist] = React.useState(1);
		const [distScale, setDistScale] = React.useState(2);
		const [lineWidth, setLineWidth] = React.useState(1);
		const [colors, setColors] = React.useState([
			"#000000", "#000000", "#000000", "#000000", "#000000",
			"#000000", "#000000", "#000000", "#000000", "#000000"]);
		const [colorMod, setColorMod] = React.useState<util.HSL>({ h: 0, s: 1, l: 1 });

		const [iterations, _setIterations] = React.useState(0);
		const setIterations = (newIterations: number) => {
			let newSequence: string;
			if (newIterations - iterations == 1) {
				//if iterations were iterated, only rewrite sequence once
				newSequence = lSystem.rewrite(rulesDef, sequence);
			} else {
				newSequence = axiom;
				for (let i = 0; i < newIterations; i++) {
					newSequence = lSystem.rewrite(rulesDef, newSequence);
				}
			}

			setSequence(newSequence);
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
		const turtle = React.useRef(new lSystem.Turtle());

		//re-draw if delta, dist, etc. change
		//use effect is not designed for this, but fuck it
		React.useEffect(() => {
			redraw();
		}, [turnAngle, turnScale, dist, distScale, sequence, lineWidth, colors, colorMod]);

		const redraw = () => {
			const ctx = canvasRef.current.getContext("2d");
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 800, 800);
			turtle.current.draw(sequence,
				{
					dist,
					turnAngle: Math.PI * turnAngle / 180,
					turnScale,
					distScale,
					lineWidth,
					colors,
					colorMod
				}, ctx);
		};

		const onSelectFile = (file: ui.File) => {
			const system: lSystem.LSystem = lSystem.loadLSystem(file.contents);
			setName(system.name);
			setAxiom(system.axiom);
			setDist(system.dist);
			setDistScale(system.distScale);
			setTurnAngle(system.turnAngle);
			setTurnScale(system.turnScale);
			setLineWidth(system.lineWidth);
			setColors(system.colors);
			setColorMod(system.colorMod);
			_setIterations(0);

			const newRuleList: Array<Rule> = [];
			for (const pred in system.rules) {
				const current = system.rules[pred];
				for (const rule of current) {
					newRuleList.push({ ...rule, pred });
				}
			}
			setRuleList(newRuleList);
		};

		/**
		 * Recalculates probabilities of all rules with the same predecessor
		 * @param predecessor 	predecessor
		 * @param rules 		rules array after update
		 */
		const recalcProbs = (predecessor: string, rules: Array<Rule>) => {
			const filteredRules = rules.filter((rule) => rule.pred == predecessor);

			let totalOdds = 0;
			for (const rule of filteredRules) {
				totalOdds += rule.odds;
			}

			for (const rule of filteredRules) {
				rule.prob = rule.odds / totalOdds;
			}
		};

		const onChangeRule = (i: number, pred: string, succ: string, odds: number) => {
			const rule = ruleList[i];
			rule.succ = succ;

			//if odds changed, need to recalculate probabilities of this rule as well as all related ones
			if (rule.odds != odds) {
				rule.odds = odds;
				recalcProbs(rule.pred, ruleList);
			} else if (rule.pred != pred) { //if predecessor changed, recalc probabilities for both old and new predecessors and sort
				const oldPred = rule.pred;
				rule.pred = pred;
				recalcProbs(oldPred, ruleList);
				recalcProbs(rule.pred, ruleList);
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
		};

		const onRemoveRule = (i: number) => {

			const oldRule = ruleList[i];
			ruleList.splice(i, 1);

			//recalculate probabilities
			recalcProbs(oldRule.pred, ruleList);

			setRuleList(ruleList.slice(0));
		};

		const redo = () => {
			let newSequence = axiom;
			for (let i = 0; i < iterations; i++) {
				newSequence = lSystem.rewrite(rulesDef, newSequence);
			}

			setSequence(newSequence);
		};

		const save = () => {
			const data: lSystem.LSystem = {
				name,
				axiom,
				dist,
				distScale,
				turnAngle,
				turnScale,
				lineWidth,
				rules: rulesDef,
				colors,
				colorMod
			};
			const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
			const a = document.createElement("a");
			a.download = `${name}.json`;
			a.href = URL.createObjectURL(blob);
			a.addEventListener("click", (e) => setTimeout(() => URL.revokeObjectURL(a.href), 1000));
			a.click();
		};

		return (
			<div className="line">
				<div className="column">
					<div className="line">
						<ui.FileUpload label="Select the l-system file: " accept="json" callback={onSelectFile}></ui.FileUpload>
						<button onClick={save}>Save as...</button>
					</div>

					<textarea readOnly={true} value={sequence}></textarea>
					<div className="line">
						<label>Name:</label>
						<input value={name} onChange={(e) => setName(e.target.value)}></input>
					</div>
					<div className="line">
						<label>Axiom:</label>
						<input value={axiom} onChange={(e) => setAxiom(e.target.value)}></input>
					</div>
					<div className="line">
						<div className="line">
							<label>Delta:</label>
							<input type="number" value={turnAngle} onChange={(e) => setTurnAngle(e.target.valueAsNumber)}></input>
						</div>

						<div className="line">
							<label>Delta Scale:</label>
							<input step={0.1} type="number" value={turnScale} onChange={(e) => setTurnScale(e.target.valueAsNumber)}></input>
						</div>
					</div>
					<div className="line">
						<div className="line">
							<label>Dist:</label>
							<input min={0} type="number" value={dist} onChange={(e) => setDist(e.target.valueAsNumber)}></input>
						</div>
						<div className="line">
							<label>Dist Scale:</label>
							<input min={0} step={0.1} type="number" value={distScale} onChange={(e) => setDistScale(e.target.valueAsNumber)}></input>
						</div>
					</div>
					<div className="line">
						<label>Line Width:</label>
						<input min={1} step={1} type="number" value={lineWidth} onChange={(e) => setLineWidth(e.target.valueAsNumber)}></input>
					</div>
					<ColorPalette colors={colors} onColorChange={setColors}></ColorPalette>
					<div className="line">
						Color Modifier:
						<input type="number" min="0" max="360" value={colorMod.h} onChange={
							(e) => setColorMod(Object.assign({}, colorMod, { h: e.target.valueAsNumber }))
						}></input>
						<input type="number" min="0" step="0.01" value={colorMod.s} onChange={
							(e) => setColorMod(Object.assign({}, colorMod, { s: e.target.valueAsNumber }))
						}></input>
						<input type="number" min="0" step="0.01" value={colorMod.l} onChange={
							(e) => setColorMod(Object.assign({}, colorMod, { l: e.target.valueAsNumber }))
						}></input>
					</div>
					<div className="line">
						<div>
							<label>Iterations:</label>
							<input min={0} type="number" value={iterations} onChange={(e) => setIterations(e.target.valueAsNumber)}></input>
						</div>
						<button onClick={redo}>Redo</button>
					</div>
					<div>
						<button onClick={onAddRule}>Add Rule</button>
						Rules:
						{ruleList.map((rule, i) => <Rule {...rule} key={i} onChange={onChangeRule.bind(null, i)} onRemove={onRemoveRule.bind(null, i)}></Rule>)}

					</div>
				</div>

				<canvas ref={canvasRef} width="800" height="800"></canvas>
			</div>
		);
	};
}