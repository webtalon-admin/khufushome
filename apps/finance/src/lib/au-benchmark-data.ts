export interface AuBenchmarkRow {
	age_group: string;
	age_min: number;
	age_max: number;
	male_median: number;
	female_median: number;
	male_average: number | null;
	female_average: number | null;
	male_p75: number;
	female_p75: number;
	male_p90: number;
	female_p90: number;
	source: string;
}

export const AU_BENCHMARK_DATA: AuBenchmarkRow[] = [
	{ age_group: "18-24", age_min: 18, age_max: 24, male_median: 4617, female_median: 4275, male_average: null, female_average: null, male_p75: 10040, female_p75: 9120, male_p90: 20201, female_p90: 18038, source: "ATO 2021-22" },
	{ age_group: "25-29", age_min: 25, age_max: 29, male_median: 17545, female_median: 17840, male_average: null, female_average: null, male_p75: 32315, female_p75: 29823, male_p90: 55994, female_p90: 47360, source: "ATO 2021-22" },
	{ age_group: "30-34", age_min: 30, age_max: 34, male_median: 39796, female_median: 34327, male_average: 55690, female_average: 46588, male_p75: 66952, female_p75: 55794, male_p90: 106932, female_p90: 86390, source: "ATO 2021-22 + ASFA Jun 2023" },
	{ age_group: "35-39", age_min: 35, age_max: 39, male_median: 70181, female_median: 54391, male_average: 90822, female_average: 71686, male_p75: 114015, female_p75: 89927, male_p90: 176461, female_p90: 141394, source: "ATO 2021-22 + ASFA" },
	{ age_group: "40-44", age_min: 40, age_max: 44, male_median: 101231, female_median: 74066, male_average: null, female_average: null, male_p75: 165702, female_p75: 127657, male_p90: 258200, female_p90: 208376, source: "ATO 2021-22" },
	{ age_group: "45-49", age_min: 45, age_max: 49, male_median: 133616, female_median: 93471, male_average: null, female_average: null, male_p75: 227297, female_p75: 169036, male_p90: 366667, female_p90: 288118, source: "ATO 2021-22" },
	{ age_group: "50-54", age_min: 50, age_max: 54, male_median: 162146, female_median: 111063, male_average: null, female_average: null, male_p75: 294452, female_p75: 214781, male_p90: 503768, female_p90: 388867, source: "ATO 2021-22" },
	{ age_group: "55-59", age_min: 55, age_max: 59, male_median: 186255, female_median: 128675, male_average: null, female_average: null, male_p75: 366500, female_p75: 268241, male_p90: 674009, female_p90: 519607, source: "ATO 2021-22" },
	{ age_group: "60-64", age_min: 60, age_max: 64, male_median: 205385, female_median: 153685, male_average: 395852, female_average: 313360, male_p75: 441054, female_p75: 340404, male_p90: 877501, female_p90: 696380, source: "ATO 2021-22 + ASFA" },
	{ age_group: "65-69", age_min: 65, age_max: 69, male_median: 206091, female_median: 191475, male_average: null, female_average: null, male_p75: 470826, female_p75: 424000, male_p90: 990396, female_p90: 867201, source: "ATO 2021-22" },
	{ age_group: "70-74", age_min: 70, age_max: 74, male_median: 200349, female_median: 198005, male_average: null, female_average: null, male_p75: 483919, female_p75: 453279, male_p90: 1070257, female_p90: 955240, source: "ATO 2021-22" },
	{ age_group: "75+", age_min: 75, age_max: 100, male_median: 166185, female_median: 161201, male_average: null, female_average: null, male_p75: 445675, female_p75: 408434, male_p90: 1083014, female_p90: 943040, source: "ATO 2021-22" },
];

export type Gender = "male" | "female";

export function getBenchmarkForAge(age: number): AuBenchmarkRow | null {
	return AU_BENCHMARK_DATA.find(
		(r) => r.age_min <= age && r.age_max >= age,
	) ?? null;
}

export function getPercentileRank(
	balance: number,
	row: AuBenchmarkRow,
	gender: Gender,
): string {
	const median = gender === "male" ? row.male_median : row.female_median;
	const p75 = gender === "male" ? row.male_p75 : row.female_p75;
	const p90 = gender === "male" ? row.male_p90 : row.female_p90;

	if (balance >= p90) return "Top 10%";
	if (balance >= p75) return "Top 25%";
	if (balance >= median) return "Above median";
	return "Below median";
}
