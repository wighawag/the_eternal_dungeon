package base;

import thx.promise.Promise;
using thx.Arrays;
import thx.Error;

class PromiseTools {
	static public function allDone<T>(arr : Array<Promise<T>>) : Promise<Array<T>> {
		if (arr.length == 0) {
			return Promise.value([]);
		}

		return Promise.create(function(resolve, reject) {
			var results = [];
			var counter = 0;
			var errors = [];

			arr.mapi(function(p, i) {
				p.either(function(value) {
					if (errors.length == 0) {
						results[i] = value;
					}

					counter++;

					if (counter == arr.length) {
						if (errors.length != 0) {
							reject(Error.fromDynamic(errors));
						} else {
							resolve(results);
						}
					}
				}, function(err) {
					errors.push(err);
					counter++;

					if (counter == arr.length) {
						reject(Error.fromDynamic(errors));
					}
				});
			});
		});
	}
}