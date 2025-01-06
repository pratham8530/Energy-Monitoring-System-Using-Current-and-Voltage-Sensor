
let currentChart, voltageChart, powerChart, energyChart;

// Function to fetch data from the server
function fetchData() {
	fetch('/data')  // Make a GET request to the /data route
		.then(response => response.json())
		.then(data => {
			updateGraph(currentChart, data.current);
			updateGraph(voltageChart, data.voltage);
			updateGraph(powerChart, data.power);
			updateGraph(energyChart, data.energy);

			// Update the displayed values
			document.getElementById('current').innerText = `${data.current.toFixed(2)} A`;
			document.getElementById('voltage').innerText = `${data.voltage.toFixed(2)} V`;
			document.getElementById('power').innerText = `${data.power.toFixed(2)} W`;
			document.getElementById('energy').innerText = `${data.energy.toFixed(4)} kWh`;

			checkLimits(data.current, data.voltage, data.power, data.energy);

			const device = document.getElementById('device-selector').value;
			updateTips(device, data.power, data.current, data.voltage);
		})
		.catch(error => console.error('Error fetching data:', error));
}

function updateGraph(chart, newValue) {
	const time = new Date().toLocaleTimeString();
	chart.data.labels.push(time);
	chart.data.datasets[0].data.push(newValue);

	// Keep only the latest 10 data points for smoothness
	if (chart.data.labels.length > 10) {
		chart.data.labels.shift();
		chart.data.datasets[0].data.shift();
	}

	chart.update();
}

function createSmoothChart(ctx, label, minY, maxY, stepSize) {
	return new Chart(ctx, {
		type: 'line',
		data: {
			labels: [], // Time labels will be added dynamically
			datasets: [{
				label: label,
				data: [], // Data points will be added dynamically
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 2,
				fill: false,
				tension: 0.4 // For smooth curves
			}]
		},
		options: {
			responsive: true,
			animation: {
				duration: 0
			},
			scales: {
				x: {
					display: false // Hide X-axis
				},
				y: {
					display: true, // Show Y-axis
					min: minY,     // Use custom min value for Y-axis
					max: maxY,     // Use custom max value for Y-axis
					ticks: {
						stepSize: stepSize // Use custom step size for Y-axis
					}
				}
			},
			plugins: {
				legend: {
					display: false
				}
			}
		}
	});
}


function createMonthlyChart(ctx) {
	const sampleDataPower = [150, 200, 170, 220];
	const sampleDataEnergy = [10, 15, 12, 18];

	return new Chart(ctx, {
		type: 'bar',
		data: {
			labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
			datasets: [
				{
					label: 'Max Power (W)',
					data: sampleDataPower,
					backgroundColor: 'rgba(75, 192, 192, 0.5)',
					borderColor: 'rgba(75, 192, 192, 1)',
					borderWidth: 1,
					yAxisID: 'y-axis-power',
				},
				{
					label: 'Energy Used (kWh)',
					data: sampleDataEnergy,
					backgroundColor: 'rgba(153, 102, 255, 0.5)',
					borderColor: 'rgba(153, 102, 255, 1)',
					borderWidth: 1,
					yAxisID: 'y-axis-energy',
				}
			]
		},
		options: {
			responsive: true,
			scales: {
				y: {
					type: 'linear',
					position: 'left',
					beginAtZero: true,
					title: {
						display: true,
						text: 'Power (W)',
					}
				},
				'y-axis-energy': {
					type: 'linear',
					position: 'right',
					beginAtZero: true,
					title: {
						display: true,
						text: 'Energy (kWh)',
					},
					grid: {
						drawOnChartArea: false // Only want the grid lines for one axis to show up
					}
				}
			},
			plugins: {
				legend: {
					display: true,
					position: 'top',
				}
			}
		}
	});
}

// Function to update tips based on power consumption, current, and voltage
function updateTips(device, power, current, voltage) {
	const tipElement = document.getElementById('tip-1');
	const thresholds = {
		bulb: 15,
		tv: 50,
		laptop: 30,
		charger: 5
	};
	const thresholdTips = {
		bulb: 'Tip: Switch to an LED bulb to reduce power consumption as it exceeds 15W.',
		tv: 'Tip: Your TV is consuming a lot of energy, consider reducing brightness or using energy-saving mode.',
		laptop: 'Tip: Your laptop is consuming too much power, lower brightness or use power-efficient mode.',
		charger: 'Tip: Unplug your charger once the device is fully charged to save energy.'
	};

	if (power === 0 && voltage === 0) {
		tipElement.innerText = 'Please connect a device.';
	} else if (power > thresholds[device]) {
		tipElement.innerText = thresholdTips[device];
	} else {
		tipElement.innerText = 'Your device is consuming power within the normal range.';
	}
}

// Call the fetchData function initially and set an interval to fetch data periodically
window.onload = function () {
	// Create charts with individual Y-axis settings
	const currentChart = createSmoothChart(document.getElementById('currentChart'), 'Current (A)', 0, 20, 2);
	const voltageChart = createSmoothChart(document.getElementById('voltageChart'), 'Voltage (V)', 0, 250, 50);
	const powerChart = createSmoothChart(document.getElementById('powerChart'), 'Power (W)', 0, 200, 25);
	const energyChart = createSmoothChart(document.getElementById('energyChart'), 'Energy (kWh)', 0, 1, 0.1);

	const monthlyCtx = document.getElementById('monthly-chart').getContext('2d'); // Get context for the monthly chart

	currentChart = createSmoothChart(currentCtx, 'Current');
	voltageChart = createSmoothChart(voltageCtx, 'Voltage');
	powerChart = createSmoothChart(powerCtx, 'Power');
	energyChart = createSmoothChart(energyCtx, 'Energy');
	monthlyChart = createMonthlyChart(monthlyCtx); // Create the monthly chart

	fetchData();
	setInterval(fetchData, 5000);  // Fetch data every 5 seconds
};

function setLimits() {
	const currentLimit = parseFloat(document.getElementById('current-limit').value);
	const voltageLimit = parseFloat(document.getElementById('voltage-limit').value);
	const powerLimit = parseFloat(document.getElementById('power-limit').value);
	const energyLimit = parseFloat(document.getElementById('energy-limit').value);

	fetch('/set-limits', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			current_limit: currentLimit,
			voltage_limit: voltageLimit,
			power_limit: powerLimit,
			energy_limit: energyLimit
		}),
	})
		.then(response => response.json())
		.then(data => {
			alert(data.message);  // Confirmation alert
		})
		.catch(error => console.error('Error setting limits:', error));
}

setInterval(() => {
	fetch('/data')
		.then(response => response.json())
		.then(data => {
			document.getElementById('current-value').textContent = data.current.toFixed(2);
			document.getElementById('voltage-value').textContent = data.voltage.toFixed(2);
			document.getElementById('power-value').textContent = data.power.toFixed(2);
			document.getElementById('energy-value').textContent = data.energy.toFixed(2);

			// Check if limits are exceeded
			if (data.current > parseFloat(document.getElementById('current-limit').value)) {
				document.getElementById('limit-warning').style.display = 'block';
				document.getElementById('limit-warning').classList.add('blink');
			} else {
				document.getElementById('limit-warning').style.display = 'none';
				document.getElementById('limit-warning').classList.remove('blink');
			}
		})
		.catch(error => console.error('Error fetching data:', error));
}, 1000); // Update every second
function checkLimits(current, voltage, power, energy) {
	const currentLimit = parseFloat(document.getElementById('current-limit').value);
	const voltageLimit = parseFloat(document.getElementById('voltage-limit').value);
	const powerLimit = parseFloat(document.getElementById('power-limit').value);
	const energyLimit = parseFloat(document.getElementById('energy-limit').value);

	// Get container elements
	const currentContainer = document.querySelector("#current-chart").parentElement;
	const voltageContainer = document.querySelector("#voltage-chart").parentElement;
	const powerContainer = document.querySelector("#power-chart").parentElement;
	const energyContainer = document.querySelector("#energy-chart").parentElement;

	// Highlight in red if the value exceeds the limit, otherwise revert to default color
	if (current > currentLimit) {
		currentContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Red highlight
	} else {
		currentContainer.style.backgroundColor = ''; // Default color
	}

	if (voltage > voltageLimit) {
		voltageContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
	} else {
		voltageContainer.style.backgroundColor = '';
	}

	if (power > powerLimit) {
		powerContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
	} else {
		powerContainer.style.backgroundColor = '';
	}

	if (energy > energyLimit) {
		energyContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
	} else {
		energyContainer.style.backgroundColor = '';
	}
}

function createCarbonFootprintChart(ctx, energyData) {
	const carbonEmissions = energyData.map(energy => (energy * 0.82).toFixed(2)); // Convert kWh to kg CO2

	return new Chart(ctx, {
		type: 'bar',
		data: {
			labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
			datasets: [{
				label: 'Carbon Footprint (kg CO2)',
				data: carbonEmissions,
				backgroundColor: 'rgba(54, 162, 235, 0.5)',
				borderColor: 'rgba(54, 162, 235, 1)',
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
					title: {
						display: true,
						text: 'kg CO2'
					}
				}
			},
			plugins: {
				legend: {
					display: true,
					position: 'top'
				}
			}
		}
	});
}

window.onload = function () {
	const currentCtx = document.getElementById('current-chart').getContext('2d');
	const voltageCtx = document.getElementById('voltage-chart').getContext('2d');
	const powerCtx = document.getElementById('power-chart').getContext('2d');
	const energyCtx = document.getElementById('energy-chart').getContext('2d');
	const monthlyCtx = document.getElementById('monthly-chart').getContext('2d'); // Monthly chart context
	const carbonFootprintCtx = document.getElementById('carbon-footprint-chart').getContext('2d'); // New carbon footprint chart

	currentChart = createSmoothChart(currentCtx, 'Current');
	voltageChart = createSmoothChart(voltageCtx, 'Voltage');
	powerChart = createSmoothChart(powerCtx, 'Power');
	energyChart = createSmoothChart(energyCtx, 'Energy');
	monthlyChart = createMonthlyChart(monthlyCtx); // Create the monthly chart

	const energyData = [10, 15, 12, 18]; // Sample data in kWh for 4 weeks

	createCarbonFootprintChart(carbonFootprintCtx, energyData);

	fetchData();
	setInterval(fetchData, 5000);  // Fetch data every 5 seconds
};
