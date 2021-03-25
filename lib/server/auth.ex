defmodule Server.AuthPlug do
  @behaviour Plug

  import Plug.Conn
  defmodule IncompleteRequestError do
    @moduledoc """
    Error raised when a required field is missing.
    """

    defexception message: ""
  end

  def init(opts), do: opts # maybe list the routes that need to be authenticated in opts

  def call(conn, _opts)  when hd(conn.path_info) == "api"
    do
        case conn.path_info do
            ["api", "account", _] ->
                if Enum.member?(conn.req_headers, {"key", "zozo"}) do
                    conn
                else 
                    body = Poison.encode!(%{"Error" => "unauthorised"})
                    send_resp(conn, 401, body)
                end
            _ -> conn
        end
    end

  def call(conn, _opts) do
    IO.puts "unprotected"
    conn
  end

end