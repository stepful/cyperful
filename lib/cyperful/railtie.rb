# we need to allow the iframe to be embedded in the cyperful server
# TODO: consider Rack middleware instead to support non-Rails apps?
class Cyperful::Railtie < Rails::Railtie
  config.after_initialize do |app|
    app.config.content_security_policy do |policy|
      policy.frame_ancestors(:self, "localhost:#{Cyperful.config.port}")
    end
  end
end
