namespace ui {

	enum ParamName {
		StartAngle = "startAngle",
		Dist = "dist",
		DistScale = "distScale",
		TurnAngle = "turnAngle",
		TurnScale = "turnScale",
		LineWidth = "lineWidth",
		WidthScale = "widthScale",

		Scale = "scale",
		StartX = "startX",
		StartY = "startY",
		Colors = "colors",
		ColorMod = "colorMod"
	};

	export const App: React.FC<{}> = () => {

		const [name, setName] = React.useState("");
		const [axiom, _setAxiom] = React.useState("");
		const [sequence, _setSequence] = React.useState(axiom);

		const setSequence = (newSequence: string) => {
			//redraw
			const ctx = canvasRef.current.getContext("2d");
			const settings: lSystem.TurtleSettings = {
				startX,
				startY,
				startAngle: Math.PI * startAngle / 180,
				scale,
				dist,
				distScale,
				turnAngle: Math.PI * turnAngle / 180,
				turnScale,
				lineWidth,
				widthScale,
				colors,
				colorMod
			};
			if (useCalibration) {
				const calibrationData = turtle.current.calibrate(newSequence, ctx.canvas.width, ctx.canvas.height, settings);
				settings.scale = calibrationData.scale;
				settings.startX = calibrationData.startX;
				settings.startY = calibrationData.startY;

				setScale(calibrationData.scale);
				setStartX(calibrationData.startX);
				setStartY(calibrationData.startY);
			}
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 800, 800);
			turtle.current.draw(newSequence, settings, ctx);

			_setSequence(newSequence);
		};

		const setAxiom = (newAxiom: string) => {
			setSequence(newAxiom);
			_setAxiom(newAxiom);
		};

		const [startX, setStartX] = React.useState(0);
		const [startY, setStartY] = React.useState(0);
		const [scale, setScale] = React.useState(1);
		const [useCalibration, setUseCalibration] = React.useState(true);
		const [startAngle, setStartAngle] = React.useState(90);

		const [turnAngle, setTurnAngle] = React.useState(60);
		const [turnScale, setTurnScale] = React.useState(1);
		const [dist, setDist] = React.useState(1);
		const [distScale, setDistScale] = React.useState(2);
		const [lineWidth, setLineWidth] = React.useState(1);
		const [widthScale, setWidthScale] = React.useState(1);
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

		const onParamChange = (paramName: ParamName, paramValue: number | util.HSL | Array<string>) => {
			const ctx = canvasRef.current.getContext("2d");
			const settings: lSystem.TurtleSettings = {
				startX,
				startY,
				startAngle: Math.PI * startAngle / 180,
				scale,
				dist,
				distScale,
				turnAngle: Math.PI * turnAngle / 180,
				turnScale,
				lineWidth,
				widthScale,
				colors,
				colorMod
			};

			//set changed param since react state is not updated yet
			if (paramName == ParamName.StartAngle || paramName == ParamName.TurnAngle) {
				settings[paramName] = Math.PI * (paramValue as number) / 180;
			} else {
				settings[paramName] = (paramValue as any);
			}

			if (useCalibration) {
				switch (paramName) {
					case ParamName.StartAngle:
					case ParamName.Dist:
					case ParamName.DistScale:
					case ParamName.TurnAngle:
					case ParamName.TurnScale:
					case ParamName.LineWidth:
					case ParamName.WidthScale:

						const calibrationData = turtle.current.calibrate(sequence, ctx.canvas.width, ctx.canvas.height, settings);
						settings.scale = calibrationData.scale;
						settings.startX = calibrationData.startX;
						settings.startY = calibrationData.startY;

						setScale(calibrationData.scale);
						setStartX(calibrationData.startX);
						setStartY(calibrationData.startY);
						break;
					default:
				}
			}

			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, 800, 800);
			turtle.current.draw(sequence, settings, ctx);
		};

		//[ sequence]);

		const onSelectFile = (file: ui.File) => {
			const system: lSystem.LSystem = lSystem.loadLSystem(file.contents);
			setName(system.name);
			setAxiom(system.axiom);
			setDist(system.dist);
			setDistScale(system.distScale);
			setTurnAngle(system.turnAngle);
			setTurnScale(system.turnScale);
			setLineWidth(system.lineWidth);
			setWidthScale(system.widthScale);
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
						<TooltipLabel for="nameInput" text="Name of this l-system">Name:</TooltipLabel>
						<input id="nameInput" value={name} onChange={(e) => setName(e.target.value)}></input>
					</div>
					<div className="line">
						<TooltipLabel for="axiomInput" text="Initial sequence value">Axiom:</TooltipLabel>
						<input id="axiomInput" value={axiom} onChange={(e) => setAxiom(e.target.value)}></input>
					</div>
					<div className="line">
						<div className="line">
							<TooltipLabel for="calibrateCheckbox" text="Enable to fit drawing to canvas">Auto-scale:</TooltipLabel>
							<input id="calibrateCheckbox" type="checkbox" checked={useCalibration} onChange={(e) => setUseCalibration(e.target.checked)}></input>
						</div>

						<div className="line">
							<TooltipLabel for="scaleInput" text="Drawing scale">Scale:</TooltipLabel>
							<input id="scaleInput" type="number" min={0} step={0.05} disabled={useCalibration} value={scale} onChange={
								(e) => {
									onParamChange(ParamName.Scale, e.target.valueAsNumber);
									setScale(e.target.valueAsNumber);
								}
							}></input>
						</div>
					</div>
					<div className="line">
						<div className="line">
							<TooltipLabel for="startXInput" text="Turtle initial x coordinate">Start X:</TooltipLabel>
							<input id="startXInput" type="number" step={1} disabled={useCalibration} value={startX} onChange={
								(e) => {
									onParamChange(ParamName.StartX, e.target.valueAsNumber);
									setStartX(e.target.valueAsNumber);
								}
							}></input>
						</div>

						<div className="line">
							<TooltipLabel for="startYInput" text="Turtle initial y coordinate">Start Y:</TooltipLabel>
							<input id="startYInput" type="number" step={1} disabled={useCalibration} value={startY} onChange={
								(e) => {
									onParamChange(ParamName.StartY, e.target.valueAsNumber);
									setStartY(e.target.valueAsNumber);
								}
							}></input>
						</div>

						<div className="line">
							<TooltipLabel for="startAngleInput" text="Turtle initial angle(in degrees)">Start Angle:</TooltipLabel>
							<input id="startAngleInput" type="number" step={1} value={startAngle} onChange={
								(e) => {
									onParamChange(ParamName.StartAngle, e.target.valueAsNumber);
									setStartAngle(e.target.valueAsNumber);
								}
							}></input>
						</div>
					</div>
					<div className="line">
						<div className="line">
							<TooltipLabel for="deltaInput" text="Turtle turn angle(in degrees)">Delta:</TooltipLabel>
							<input id="deltaInput" type="number" value={turnAngle} onChange={
								(e) => {
									onParamChange(ParamName.TurnAngle, e.target.valueAsNumber);
									setTurnAngle(e.target.valueAsNumber);
								}
							}></input>
						</div>

						<div className="line">
							<TooltipLabel for="turnScaleInput" text="Multiplier for turtle turn angle">Delta Scale:</TooltipLabel>
							<input id="turnScaleInput" step={0.05} type="number" value={turnScale} onChange={
								(e) => {
									onParamChange(ParamName.TurnScale, e.target.valueAsNumber);
									setTurnScale(e.target.valueAsNumber);
								}
							}></input>
						</div>
					</div>
					<div className="line">
						<div className="line">
							<TooltipLabel for="distInput" text="Turtle move distance(in pixels)">Dist:</TooltipLabel>
							<input id="distInput" min={0} type="number" value={dist} onChange={
								(e) => {
									onParamChange(ParamName.Dist, e.target.valueAsNumber);
									setDist(e.target.valueAsNumber);
								}
							}></input>
						</div>
						<div className="line">
							<TooltipLabel for="distScaleInput" text="Multiplier for turtle move distance">Dist Scale:</TooltipLabel>
							<input id="distScaleInput" min={0} step={0.05} type="number" value={distScale} onChange={
								(e) => {
									onParamChange(ParamName.DistScale, e.target.valueAsNumber);
									setDistScale(e.target.valueAsNumber);
								}
							}></input>
						</div>
					</div>
					<div className="line">
						<div className="line">
							<TooltipLabel for="lineWidthInput" text="Width of line drawn by turtle">Line Width:</TooltipLabel>
							<input id="lineWidthInput" min={1} step={1} type="number" value={lineWidth} onChange={
								(e) => {
									onParamChange(ParamName.LineWidth, e.target.valueAsNumber);
									setLineWidth(e.target.valueAsNumber);
								}
							}></input>
						</div>
						<div className="line">
							<TooltipLabel for="widthScaleInput" text="Line width multiplier">Width Scale:</TooltipLabel>
							<input id="widthScaleInput" min={0} step={0.1} type="number" value={widthScale} onChange={
								(e) => {
									onParamChange(ParamName.WidthScale, e.target.valueAsNumber);
									setWidthScale(e.target.valueAsNumber);
								}
							}></input>
						</div>
					</div>
					<ColorPalette colors={colors} onColorChange={
						(colors) => {
							onParamChange(ParamName.Colors, colors);
							setColors(colors);
						}
					}></ColorPalette>
					<div className="line">
						<TooltipLabel text="Color modifier in HSL format. When color is modified, hue is added/subtracted, while saturation and lightness are multiplied">Color Modifier:</TooltipLabel>
						<input type="number" min="0" max="360" value={colorMod.h} onChange={
							(e) => {
								const newColorMod: util.HSL = Object.assign({}, colorMod, { h: e.target.valueAsNumber });
								onParamChange(ParamName.ColorMod, newColorMod);
								setColorMod(newColorMod);
							}
						}></input>
						<input type="number" min="0" step="0.01" value={colorMod.s} onChange={
							(e) => {
								const newColorMod: util.HSL = Object.assign({}, colorMod, { s: e.target.valueAsNumber });
								onParamChange(ParamName.ColorMod, newColorMod);
								setColorMod(newColorMod);
							}
						}></input>
						<input type="number" min="0" step="0.01" value={colorMod.l} onChange={
							(e) => {
								const newColorMod: util.HSL = Object.assign({}, colorMod, { l: e.target.valueAsNumber });
								onParamChange(ParamName.ColorMod, newColorMod);
								setColorMod(newColorMod);
							}
						}></input>
					</div>
					<div className="line">
						<TooltipLabel for="iterInput" text="Number of iterations the rules are applied to the initial sequence. Changing this value will automatically redraw the image.">Iterations:</TooltipLabel>
						<input id="iterInput" min={0} type="number" value={iterations} onChange={(e) => setIterations(e.target.valueAsNumber)}></input>
						<button onClick={redo}>Redo</button>
					</div>
					<div className="line">
						<button onClick={onAddRule}>Add Rule</button>
						<TooltipLabel text="Rules used to modify the sequence">Rules:</TooltipLabel>
						{ruleList.map((rule, i) => <Rule {...rule} key={i} onChange={onChangeRule.bind(null, i)} onRemove={onRemoveRule.bind(null, i)}></Rule>)}
					</div>
				</div>

				<canvas ref={canvasRef} width="800" height="800"></canvas>
			</div>
		);
	};
}