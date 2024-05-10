class Cyperful::Railtie < Rails::Railtie
  initializer "cyperful.configure_rails_initialization" do |app|
    app.config.content_security_policy do |policy|
      policy.frame_ancestors(:self, "localhost:#{Cyperful.config.port}")
    end
  end
end
