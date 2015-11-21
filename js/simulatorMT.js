
function Create2DArray(rows) {
		var arr = [];
		for (var i=0;i<rows;i++) {
			arr[i] = [];
		}
		return arr;
	}
	
function SelectColumn(arrIn, col) {
		var arrOut = [];
		for(var i = 0; i < arrIn.length; i++){
			arrOut[i] = arrIn[i].slice(col, col+1)[0];
		}
		return arrOut;
	}
	
	



function simulation(readings, boluses){

	var T_s = 5;	//sampling period [min]
	var G_b = 5.0;	//basal glucose level [mmol/l]
	
	
	// --------------------------------------------------------
	// handling "readings and boluses" from app

	
	var finalIndex = readings;

	var u_arr = _.range(finalIndex).map(function() {return 0;});
	var d_arr = _.range(finalIndex).map(function() {return 0;});
	
	for(var idx in boluses) {
			u_arr[idx] = (boluses[idx].u / 150) / T_s;  // (back to insulin units) and then [U/min]
			d_arr[idx] = (boluses[idx].d * 5) / T_s;	// (back to grams) and then to [g/min]
	}
	

	// --------------------------------------------------------
	// The model itself:

	fcn_Model = function(t, x){

		var y_o = x[0]
		var y_i = x[1]
		var y_c = x[2]
		
		var T_i = param[0] //param should be an argument of this function
		var T_c = param[1]
		var T_o = param[2]
		var K_c = param[3]
		var K_i = param[4]
		
		var u_i = inpt[0] //inpt should be an argument of this function	
		var u_c = inpt[1]

		dy_i = -(1.0/T_i) * y_i + K_i * u_i
		dy_c = -(1.0/T_c) * y_c + K_c * u_c
		dy_o = -(1.0/T_o) * y_o + (1.0/T_o) * (y_i + y_c)
		
		return [dy_o, dy_i, dy_c]
	}


	// --------------------------------------------------------
	// arrays to store time and x (state-space vector of the model)
	
	var t_log = [];
	t_log[0] = 0;
	
	var x_log = Create2DArray(finalIndex);
	
	var x_0 = _.range(3).map(function() {return 0;}); // initial condition of the model
	x_log[0] = x_0; 

	
	// --------------------------------------------------------
	// Model parameters:
	// order of parameters: T_i, T_c, T_o, K_c, K_i
	var param = [17.92, 61.52, 19.84, 0.29, -4.0]

	
	// --------------------------------------------------------
	// "main loop"
	
	var timespan = _.range(2).map(function() {return 0;});
 	
	for(idx = 1; idx < finalIndex; idx++){
	
		timespan[0] = t_log[idx-1];
		timespan[1] = t_log[idx-1] + T_s;
		
		var inpt = [u_arr[idx-1], d_arr[idx-1]]
		
		y = numeric.dopri(timespan[0], timespan[1], x_log[idx-1], fcn_Model, 1e-6, 2000);
	
		x_log[idx] = _.last(y.y);
		t_log[idx] = _.last(timespan);
	
	}
	
	// --------------------------------------------------------
	// return data...
	
	bgData = SelectColumn(x_log, 0);
	
	
	for(var i = 0; i < bgData.length; i++){
		bgData[i] = (bgData[i] + G_b) * 18; // add G_b and convert to [mg/dl]
	}
	
	return data = {
			"bg": bgData
			};
			
};





