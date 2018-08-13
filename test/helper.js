const expect = require("chai").expect;
const sinon = require("sinon");
const helper = require("../src/helper");

describe("helper", function() {
	describe("shuffle", function() {
		it("should shuffle the array in place", function() {
			let array = [1, 2, 3, 4, 5, 6, 7];
			let stub = sinon.stub(Math, "random").returns(0.5);
			helper.shuffle(array);
			stub.restore();
			expect(array).eql([1, 6, 2, 5, 3, 7, 4]);
		});
	});
	describe("shuffleCopy", function() {
		it("should shuffle a copy of the array and return it", function() {
			let array = [1, 2, 3, 4, 5, 6, 7];
			let stub = sinon.stub(Math, "random").returns(0.5);
			let shuffled = helper.shuffleCopy(array);
			stub.restore();
			expect(array).eql([1, 2, 3, 4, 5, 6, 7]);
			expect(shuffled).eql([1, 6, 2, 5, 3, 7, 4]);
		});
	});
});
