defmodule Server.Database do
  use GenServer

  # Client Side
  def start_link do
    GenServer.start_link(__MODULE__, [], name: __MODULE__)
  end

  def get_account(account_id) do
    GenServer.call(__MODULE__, {:get_account, account_id})
  end

  def get_accounts do
    GenServer.call(__MODULE__, {:get_accounts})
  end

  def create_account({first_name, last_name, amount}) do
    GenServer.call(__MODULE__, {:create_account, {first_name, last_name, amount}})
  end

  def update_account(account) do
    GenServer.cast(__MODULE__, {:update_account, account})
  end

  def add_money({account_id, sum}) do
    GenServer.cast(__MODULE__, {:add_money, {account_id, sum}})
  end

  def retrieve_money({account_id, sum}) do
    GenServer.cast(__MODULE__, {:retrieve_money, {account_id, sum}})
  end

  def delete_account({account_id}) do
    GenServer.cast(__MODULE__, {:delete_account, {account_id}})
  end

  # Server Side / Callbacks
  @impl true
  def init(table) do
    :ets.new(:table, [:named_table])
    Server.FileStorage.load_to_database
    {:ok, table}
  end

  @impl true
  def handle_call({:get_account, account_id}, _form, _table) do
    {:reply, :ets.lookup(:table, account_id), :ets.lookup(:table, account_id)}
  end

  @impl true
  def handle_call({:get_accounts}, _form, _table) do
    {:reply, :ets.tab2list(:table), :ets.tab2list(:table)}
  end

  @impl true
  def handle_call({:create_account, {first_name, last_name, amount}}, _form, _table) do
    account_id = Integer.to_string(Enum.random(1000000000000..9999999999999))
    IO.inspect [{amount, DateTime.utc_now()}]
    account = {account_id, first_name, last_name, amount, DateTime.utc_now(), [{amount, DateTime.utc_now()}]}
    :ets.insert_new(:table, account)
    Server.FileStorage.store_account(account)
    {:reply, account_id, account_id}
  end

  @impl true
  def handle_cast({:add_money, {account_id, sum}}, _table) do
    account = :ets.lookup(:table, account_id)
    {id, first_name, last_name, amount, _last_update, history} = hd(account)
    account = {id, first_name, last_name, amount + sum, DateTime.utc_now(), [{amount + sum, DateTime.utc_now()} | history]}
    Server.FileStorage.store_account(account)
    {:noreply, :ets.insert(:table, account)}
  end

  @impl true
  def handle_cast({:retrieve_money, {account_id, sum}}, _table) do
    account = :ets.lookup(:table, account_id)
    {id, first_name, last_name, amount, _last_update, history} = hd(account)
    account = {id, first_name, last_name, amount - sum, DateTime.utc_now(), [{amount - sum, DateTime.utc_now()} | history]}
    Server.FileStorage.store_account(account)
    {:noreply, :ets.insert(:table, account)}
  end

  @impl true
  def handle_cast({:delete_account, {account_id}}, _table) do
    Server.FileStorage.delete_account(account_id)
    {:noreply, :ets.delete(:table, account_id)}
  end

  @impl true
  def handle_cast({:update_account, {id, first_name, last_name, balance, _last_upt, history}}, _table) do
    account = {id, first_name, last_name, balance, DateTime.utc_now(), [{balance, DateTime.utc_now()} | history]}
    Server.FileStorage.store_account(account)
    {:noreply, :ets.insert(:table, account)}
  end

end
