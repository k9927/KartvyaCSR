import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CorporateRegister() {
	const [formData, setFormData] = useState({
		companyName: '',
		email: '',
		phone: '',
		registrationNumber: '',
		website: '',
		address: '',
		industry: '',
		annualRevenue: ''
	});

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		// TODO: integrate with backend API when available
		alert('Corporate registration submitted');
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<Link className="flex items-baseline space-x-1 text-2xl font-semibold" to="/">
						<span className="text-blue-600 font-bold">CSR</span>
						<span className="text-green-600">Connect</span>
					</Link>
					<Link to="/register" className="text-sm text-blue-600 hover:text-blue-700">Back to type selection</Link>
				</div>
			</nav>

			<div className="py-10">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl font-bold mb-6">Register your Company</h2>
					<p className="text-gray-600 mb-8">Provide your company details to get started with CSR Connect.</p>

					<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
							<input name="companyName" value={formData.companyName} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
								<input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
								<input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
								<input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
								<input name="website" value={formData.website} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
								<select name="industry" value={formData.industry} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="">Select Industry</option>
									<option value="technology">Technology</option>
									<option value="finance">Finance</option>
									<option value="manufacturing">Manufacturing</option>
									<option value="healthcare">Healthcare</option>
									<option value="education">Education</option>
									<option value="retail">Retail</option>
									<option value="other">Other</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue (₹)</label>
								<select name="annualRevenue" value={formData.annualRevenue} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="">Select Revenue Range</option>
									<option value="0-100cr">0 - ₹100 Cr</option>
									<option value="100-500cr">₹100 - ₹500 Cr</option>
									<option value="500-1000cr">₹500 - ₹1000 Cr</option>
									<option value="1000cr+">₹1000 Cr+</option>
								</select>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
							<textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
						</div>
						<button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Create account</button>
					</form>
				</div>
			</div>
		</div>
	);
}

