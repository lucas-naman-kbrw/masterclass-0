defmodule Server.Supervisor do
  import Supervisor.Spec

  def start_link do
    {:ok, _} = Supervisor.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init(_) do
    children = [
      Server.Database
    ]
    supervise(
      Enum.map(children, &worker(&1, [])),
      strategy: :one_for_one
    )

  end
end
