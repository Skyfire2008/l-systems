namespace lSystem {
	export interface RuleDef {
		succ: string;
		odds: number;
		/**Probability derived from odds */
		prob: number;
	}

	/**
	 * Definition of rules for a specific predecessor symbol
	 */
	export interface RulesDef {
		[key: string]: Array<RuleDef>;
	}

	/**
	 * L System definition
	 */
	export interface LSystem {
		name: string;
		axiom: string;
		rules: RulesDef;
		delta: number;
		dist: number;
		distScale: number;
	}

	export const rewrite = (rules: RulesDef, input: string): string => {
		const charBuf: Array<string> = [];
		const inputChars = input.split("");
		for (const c of inputChars) {
			const curRules = rules[c];

			if (curRules != null) {
				//randomly select a rule
				let rand = Math.random();
				for (const rule of curRules) {
					if (rand < rule.prob) {
						charBuf.push(rule.succ);
						break;
					} else {
						rand -= rule.prob;
					}
				}

			} else {
				charBuf.push(c);
			}
		}

		return charBuf.join("");
	}
}