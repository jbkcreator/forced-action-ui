import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminContext } from '../adminContext';
import BrokersLanesSection from './BrokersLanesSection';

vi.mock('../../../api/loanLane', () => ({
  fetchAllLanes: vi.fn(),
  assignBroker: vi.fn(),
  reassignBroker: vi.fn(),
  listBrokers: vi.fn(),
  fetchLanesByBroker: vi.fn(),
  createBroker: vi.fn(),
  setBrokerActive: vi.fn(),
  listLenders: vi.fn(),
  createLender: vi.fn(),
  setLenderStatus: vi.fn(),
  setLaneFeeConfig: vi.fn(),
}));
import { fetchAllLanes, listBrokers, setLaneFeeConfig } from '../../../api/loanLane';

function makeLane(overrides = {}) {
  return {
    lane_id: 'lane-1',
    property: { address: '123 Main St', city: 'Tampa', state: 'FL', county: 'Hillsborough', owner_name: 'J. Doe' },
    current_stage: 'entered',
    current_work_state: 'unassigned',
    outcome: null,
    lender_name: null,
    assigned_broker_id: null,
    assigned_broker_name: null,
    fee_config_flag: false,
    is_stale: false,
    ...overrides,
  };
}

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/admin/brokers-lanes']}>
      <AdminContext.Provider value={{ token: 'tok' }}>
        <BrokersLanesSection />
      </AdminContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  listBrokers.mockResolvedValue({ brokers: [] });
});

describe('BrokersLanesSection — RESPA fee gate modal', () => {
  it('keeps "Enable fees" disabled until the counsel-signoff checkbox is checked', async () => {
    fetchAllLanes.mockResolvedValue({ lanes: [makeLane({ fee_config_flag: false })], total: 1 });
    renderSection();
    await waitFor(() => screen.getByText('123 Main St'));

    await userEvent.click(screen.getByRole('button', { name: /enable…/i }));

    const confirmButton = await screen.findByRole('button', { name: /enable fees/i });
    expect(confirmButton).toBeDisabled();

    await userEvent.click(screen.getByRole('checkbox'));
    expect(confirmButton).toBeEnabled();
  });

  it('sends acknowledgeRespa=true only when the checkbox was actually checked on enable', async () => {
    fetchAllLanes.mockResolvedValue({ lanes: [makeLane({ fee_config_flag: false })], total: 1 });
    setLaneFeeConfig.mockResolvedValue({ enabled: true });
    renderSection();
    await waitFor(() => screen.getByText('123 Main St'));

    await userEvent.click(screen.getByRole('button', { name: /enable…/i }));
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /enable fees/i }));

    await waitFor(() => expect(setLaneFeeConfig).toHaveBeenCalledTimes(1));
    expect(setLaneFeeConfig).toHaveBeenCalledWith('tok', 'lane-1', { enabled: true, acknowledgeRespa: true });
  });

  it("never leaks acknowledgeRespa=true onto a different lane's disable after a prior enable was cancelled", async () => {
    const laneToEnable = makeLane({ lane_id: 'lane-1', fee_config_flag: false });
    const laneToDisable = makeLane({
      lane_id: 'lane-2',
      fee_config_flag: true,
      property: { address: '456 Oak Ave', city: 'Tampa', state: 'FL', county: 'Hillsborough', owner_name: 'A. Smith' },
    });
    fetchAllLanes.mockResolvedValue({ lanes: [laneToEnable, laneToDisable], total: 2 });
    renderSection();
    await waitFor(() => screen.getByText('123 Main St'));

    // Open the enable modal for lane-1, check the acknowledgement box, then cancel without confirming.
    await userEvent.click(screen.getByRole('button', { name: /enable…/i }));
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Open the modal for lane-2 (disable path) — no checkbox is shown, and its acknowledged
    // state must not have carried over from the cancelled lane-1 session.
    await userEvent.click(screen.getByRole('button', { name: /^disable$/i }));
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    setLaneFeeConfig.mockResolvedValue({ enabled: false });
    await userEvent.click(screen.getByRole('button', { name: /disable fees/i }));

    await waitFor(() => expect(setLaneFeeConfig).toHaveBeenCalledTimes(1));
    expect(setLaneFeeConfig).toHaveBeenCalledWith('tok', 'lane-2', { enabled: false, acknowledgeRespa: false });
  });
});
