import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function NGORegister() {
	const [formData, setFormData] = useState({
		organizationName: '',
		email: '',
		phone: '',
		registrationNumber: '',
		website: '',
		address: ''
	});

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		// TODO: integrate with backend API when available
		alert('NGO registration submitted');
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
					<Link className="flex items-baseline space-x-1 text-2xl font-semibold" to="/">
						<span className="text-blue-600 font-bold">CSR</span>
						<span className="text-green-600">Connect</span>
					</Link>
					<Link to="/register" className="text-sm text-green-600 hover:text-green-700">Back to type selection</Link>
				</div>
			</nav>

			<div className="py-10">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl font-bold mb-6">Register your NGO</h2>
					<p className="text-gray-600 mb-8">Provide your organization details to get started.</p>

					<form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
							<input name="organizationName" value={formData.organizationName} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
								<input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
								<input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
								<input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
								<input name="website" value={formData.website} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
							<textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
						</div>
						<button type="submit" className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Create account</button>
					</form>
				</div>
			</div>
		</div>
	);
}

