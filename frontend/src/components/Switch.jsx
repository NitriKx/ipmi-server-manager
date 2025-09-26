import React from "react"
import { Switch as AntdSwitch } from "antd"

class Switch extends React.PureComponent {
	render() {
		const { value, checked, ...rest } = this.props
		const effectiveChecked = typeof checked === "boolean" ? checked : value
		return <AntdSwitch {...rest} checked={effectiveChecked} />
	}
}

export default Switch
