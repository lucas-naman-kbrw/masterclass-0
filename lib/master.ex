defmodule Master do

  def start(_type, _args) do
    Server.Supervisor.start_link
  end

end
