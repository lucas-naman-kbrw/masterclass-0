defmodule Server.FileStorage do

  def store_account({id, first_name, last_name, amount, last_update, history}) do
    bytes = :erlang.term_to_binary({id, first_name, last_name, amount, last_update, history})
    File.write!(Path.join("database", id), bytes)
    {:ok, :ok}
  end

  def load_to_database do
    list_of_file = Path.wildcard("database/*")
    Enum.map(list_of_file, fn x  -> add_to_ets(x)  end)
  end

  defp add_to_ets(file) do
    bytes = File.read!(file)
    account = :erlang.binary_to_term(bytes)
    :ets.insert_new(:table, account)
  end

end
