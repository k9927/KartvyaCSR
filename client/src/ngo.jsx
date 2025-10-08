import React, { useState } from 'react';

const steps = [
	{ id: 1, label: 'Basic Info' },
	{ id: 2, label: 'Organization Details' },
	{ id: 3, label: 'Documents' },
];

const NgoRegistration = () => {
	const [currentStep, setCurrentStep] = useState(1);
	const [formData, setFormData] = useState({
		orgName: '',
		panNumber: '',
		email: '',
		phone: '',
		password: '',
		description: '',
		establishmentYear: '',
		focusArea: '',
		address: '',
		city: '',
		state: '',
		pincode: '',
		ngoImage: null,
		FCRACert: null,
		cert80g: null,
		cert16A: null,
		trustDeed: null,
		agree: false,
	});

	const handleChange = (e) => {
		const { name, value, type, checked, files } = e.target;
		if (type === 'file') {
			setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
		} else if (type === 'checkbox') {
			setFormData((prev) => ({ ...prev, [name]: checked }));
		} else {
			setFormData((prev) => ({ ...prev, [name]: value }));
		}
	};

	const goNext = () => setCurrentStep((s) => Math.min(3, s + 1));
	const goPrev = () => setCurrentStep((s) => Math.max(1, s - 1));

	const handleSubmit = (e) => {
		e.preventDefault();
		// TODO: hook up to API
		console.log('Submitting NGO registration', formData);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
					<a className="flex items-baseline space-x-1 text-2xl font-semibold" href="/">
						<span className="text-blue-600 font-bold">CSR</span>
						<span className="text-green-600">Connect</span>
					</a>
				</div>
			</nav>

			<div className="py-10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-center">
						<div className="w-full lg:w-4/5">
							<div className="bg-white shadow-lg rounded-xl">
								<div className="p-6">
									{/* Progress */}
									<div className="flex items-center justify-between mb-8">
										{steps.map((step) => (
											<div key={step.id} className={`flex-1 flex items-center ${step.id !== steps.length ? 'mr-4' : ''}`}>
												<div className={`flex items-center space-x-3 ${currentStep >= step.id ? '' : 'opacity-60'}`}>
													<div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border ${currentStep >= step.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300'}`}>{step.id}</div>
													<div className="text-sm font-medium text-gray-700">{step.label}</div>
												</div>
											</div>
										))}
									</div>

									<form onSubmit={handleSubmit} className="space-y-8">
										{/* Step 1 */}
										{currentStep === 1 && (
											<div>
												<h3 className="text-xl font-semibold mb-4">Basic Information</h3>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Organization Name*</label>
														<input type="text" name="orgName" value={formData.orgName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">PAN Number*</label>
														<input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
														<input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
														<input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
													</div>
													<div className="md:col-span-2">
														<label className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
														<input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
														<div className="mt-2 h-1 w-full bg-gray-200 rounded"></div>
													</div>
												</div>

												<div className="mt-4 flex justify-end">
													<button type="button" onClick={goNext} className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-medium">Continue</button>
												</div>
											</div>
										)}

										{/* Step 2 */}
										{currentStep === 2 && (
											<div>
												<h3 className="text-xl font-semibold mb-4">Organization Details</h3>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
													<div className="md:col-span-2">
														<label className="block text-sm font-medium text-gray-700 mb-1">Organization Description*</label>
														<textarea name="description" rows={3} value={formData.description} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"></textarea>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Year of Establishment*</label>
														<input type="number" name="establishmentYear" value={formData.establishmentYear} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Primary Focus Area*</label>
														<select name="focusArea" value={formData.focusArea} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-600">
															<option value="">Select Focus Area</option>
															<option value="education">Education</option>
															<option value="healthcare">Healthcare</option>
															<option value="environment">Environment</option>
															<option value="women_empowerment">Women Empowerment</option>
															<option value="rural_development">Rural Development</option>
															<option value="skill_development">Skill Development</option>
															<option value="other">Other</option>
														</select>
													</div>
													<div className="md:col-span-2">
														<label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
														<input type="text" name="address" placeholder="Street Address" value={formData.address} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-green-600" />
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
															<input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
															<input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
															<input type="text" name="pincode" placeholder="PIN Code" value={formData.pincode} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
														</div>
													</div>
												</div>

												<div className="mt-4 flex justify-between">
													<button type="button" onClick={goPrev} className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg text-lg font-medium hover:bg-gray-50">Back</button>
													<button type="button" onClick={goNext} className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-medium">Continue</button>
												</div>
											</div>
										)}

										{/* Step 3 */}
										{currentStep === 3 && (
											<div>
												<h3 className="text-xl font-semibold mb-4">Document Upload</h3>
												<div className="grid grid-cols-1 gap-6">
													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Upload Organization Logo/Image*</label>
														<label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
															<input type="file" name="ngoImage" accept="image/jpeg,image/png" onChange={handleChange} className="hidden" required />
															<span className="text-gray-600">Drag & Drop or Click to Upload</span>
														</label>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">FCRA Certificate*</label>
														<label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
															<input type="file" name="FCRACert" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
															<span className="text-gray-600">Drag & Drop or Click to Upload</span>
														</label>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">80G Certificate*</label>
														<label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
															<input type="file" name="cert80g" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
															<span className="text-gray-600">Drag & Drop or Click to Upload</span>
														</label>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">16A Certificate*</label>
														<label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
															<input type="file" name="cert16A" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
															<span className="text-gray-600">Drag & Drop or Click to Upload</span>
														</label>
													</div>

													<div>
														<label className="block text-sm font-medium text-gray-700 mb-1">Trust Deed Certificate*</label>
														<label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
															<input type="file" name="trustDeed" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
															<span className="text-gray-600">Drag & Drop or Click to Upload</span>
														</label>
													</div>

													<div className="flex items-start">
														<input id="termsCheck" name="agree" type="checkbox" checked={formData.agree} onChange={handleChange} required className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600" />
														<label htmlFor="termsCheck" className="ml-2 text-sm text-gray-700">I agree to the <a href="#" className="text-green-600">Terms & Conditions</a> and <a href="#" className="text-green-600">Privacy Policy</a></label>
													</div>
												</div>

												<div className="mt-4 flex justify-between">
													<button type="button" onClick={goPrev} className="inline-flex items-center px-5 py-3 border border-gray-300 text-gray-700 rounded-lg text-lg font-medium hover:bg-gray-50">Back</button>
													<button type="submit" className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-medium">Complete Registration</button>
												</div>
											</div>
										)}
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NgoRegistration;
