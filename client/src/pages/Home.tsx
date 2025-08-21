import React from 'react';
import useTickets from '../hooks/useTickets';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketList from '../components/TicketList';

export const HomePage: React.FC = () => {
  const { loading, error } = useTickets();
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h2 className="mb-4 text-xl font-semibold">My Tickets</h2>
      <CreateTicketForm />
      {loading && <div className="text-gray-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <TicketList />
    </div>
  );
};

export default HomePage;


